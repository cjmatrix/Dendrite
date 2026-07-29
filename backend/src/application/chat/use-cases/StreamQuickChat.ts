import { injectable, inject } from "tsyringe";

import { IStreamQuickChatUseCase } from "./interfaces";
import { StreamQuickChatInputDTO } from "../dtos/chat.dto";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IAIService } from "../../common/ports/IAIService";
import { ILogger } from "../../common/ports/ILogger";
import { AppError } from "../../../utils/AppError";
import { QUICK_CHAT_MODEL, getProviderKey } from "../../../constants/models";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IRateLimitService } from "../../common/ports/IRateLimitService";
import { IDailyTokenUsageRepository } from "../../../domain/usage/repositories/IDailyTokenUsageRepository";
import { estimateTokenCount } from "../../../utils/tokenCounter";
import { IMessage } from "../../../domain/chat/entities/Message";
import { IAIStreamChunk, IGeminiContent, IGeminiUsageMetadata } from "../../../domain/chat/entities/Gemini";

@injectable()
export class StreamQuickChat implements IStreamQuickChatUseCase {
  constructor(
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("IAIService") private aiService: IAIService,
    @inject("ILogger") private logger: ILogger,
    @inject("IUserRepository") private userRepo: IUserRepository,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService,
    @inject("IDailyTokenUsageRepository") private dailyTokenUsageRepository: IDailyTokenUsageRepository
  ) {}

  async *execute(input: StreamQuickChatInputDTO, signal?: AbortSignal): AsyncGenerator<IAIStreamChunk> {
    const { userId, chatId, anchorMessageId, highlightedText, quickChatHistory, userTier, model, mode } = input;
    const activeModel = model || QUICK_CHAT_MODEL;
  
    const historyArray = quickChatHistory || [];
    const totalMessagesInChat = historyArray.length;
    const QUICK_CHAT_WINDOW = 16;
    const dropSize = Math.floor(QUICK_CHAT_WINDOW / 2);
    
    let dynamicWindowSize = QUICK_CHAT_WINDOW;
    if (totalMessagesInChat <= QUICK_CHAT_WINDOW) {
      dynamicWindowSize = totalMessagesInChat;
    } else {
      const droppedChunks = Math.floor(
        (totalMessagesInChat - (dropSize + 1)) / dropSize
      );
      dynamicWindowSize = totalMessagesInChat - droppedChunks * dropSize;
    }

    const recentHistory = historyArray.slice(-dynamicWindowSize);

    const backgroundContext = await this.aiService.getAnchorContext(
      chatId,
      anchorMessageId,
      this.messageRepository
    );

    const historicalString = backgroundContext
      .map((msg) => `[${msg.role}]: ${msg.content}`)
      .join("\n\n");

    const systemPrompt = this.aiService.buildQuickChatSystemPrompt(
      historicalString,
      mode
    );

    const contents: IGeminiContent[] = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...recentHistory.map((msg) => {
        let contentText = msg.content;
        if (msg.role !== "model" && highlightedText) {
          contentText = `${msg.content}\n\n[Context - Highlighted Text]: "${highlightedText}"`;
        }
        return {
          role: (msg.role === "model" ? "model" : "user") as "user" | "model",
          parts: [{ text: contentText }],
        };
      }),
    ];

    let stream: AsyncIterable<IAIStreamChunk> | null = null;
    try {
      stream = await this.aiService.streamAIContent(contents, activeModel, signal, userId, userTier);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.logger.error("AI streaming failed", error, { contents });
      throw new AppError("All your provided Gemini API keys have exceeded their free-tier limits. Please wait, or add a new key.", 429);
    }

    const onAbort = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (stream && typeof (stream as any).return === "function") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (stream as any).return().catch((err: any) => {
          this.logger.error("Error terminating AI stream on abort", err);
        });
      }
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }

    if (signal) signal.addEventListener("abort", onAbort);

    let fullReply = "";
    let finalUsageMetadata: IGeminiUsageMetadata | null = null;

    try {
      for await (const chunk of stream) {
        if (signal?.aborted) break;

        const text = chunk.text || "";
        fullReply += text;
        if (chunk.usageMetadata) finalUsageMetadata = chunk.usageMetadata;

        yield chunk;
      }
    } catch (err) {
      this.logger.error("Stream interrupted", err);
    } finally {
      if (signal) signal.removeEventListener("abort", onAbort);
    }

    if (!signal?.aborted && fullReply.trim()) {
      let promptTokens = 0;
      let responseTokens = 0;

      if (finalUsageMetadata) {
        promptTokens = finalUsageMetadata.promptTokenCount || 0;
        responseTokens = finalUsageMetadata.candidatesTokenCount || 0;
      } else {
        const promptText = highlightedText + JSON.stringify(quickChatHistory || []);
        promptTokens = estimateTokenCount(promptText);
        responseTokens = estimateTokenCount(fullReply);
      }

      let p5Tokens = 0;
      const p5Regex = /```p5\n([\s\S]*?)```/g;
      let p5Match;
      while ((p5Match = p5Regex.exec(fullReply)) !== null) {
        const p5Code = p5Match[1].trim();
        p5Tokens += estimateTokenCount(p5Code);
      }

      const quickChatOutputTokens = Math.max(0, responseTokens - p5Tokens);
      const quickChatTokens = promptTokens + quickChatOutputTokens;
      const p5VisualizationTokens = p5Tokens;
      const totalTokens = quickChatTokens + p5VisualizationTokens;

      if (totalTokens > 0) {
        try {
          const provider = getProviderKey(activeModel);
          await this.userRepo.findByIdAndUpdate(userId, {
            $inc: {
              [`token_usage.${provider}.quickChat.input`]: promptTokens,
              [`token_usage.${provider}.quickChat.output`]: quickChatOutputTokens,
              [`token_usage.${provider}.quickChat.total`]: quickChatTokens,
              [`token_usage.${provider}.p5Visualization.input`]: 0,
              [`token_usage.${provider}.p5Visualization.output`]: p5VisualizationTokens,
              [`token_usage.${provider}.p5Visualization.total`]: p5VisualizationTokens,
              tokensUsed: totalTokens,
            },
          });

          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);

          await this.dailyTokenUsageRepository.upsertUsage(userId, today, userTier || "free", {
            [`token_usage.${provider}.quickChat.input`]: promptTokens,
            [`token_usage.${provider}.quickChat.output`]: quickChatOutputTokens,
            [`token_usage.${provider}.quickChat.total`]: quickChatTokens,
            [`token_usage.${provider}.p5Visualization.input`]: 0,
            [`token_usage.${provider}.p5Visualization.output`]: p5VisualizationTokens,
            [`token_usage.${provider}.p5Visualization.total`]: p5VisualizationTokens,
          });

          await this.rateLimitService.incrementCount(userId, "quickChats");
          await this.rateLimitService.incrementTokens(userId, activeModel, totalTokens);

          const p5BlockCount = (fullReply.match(/```p5\n/g) || []).length;
          if (p5BlockCount > 0) {
            await this.rateLimitService.incrementCount(
              userId,
              "p5Visualizations",
              p5BlockCount,
            );
          }
        } catch (err) {
          this.logger.error("Failed to update user token usage for quick chat:", err);
        }
      }
    }
  }
}
