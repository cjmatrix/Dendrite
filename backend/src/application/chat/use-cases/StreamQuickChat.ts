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
    const { userId, chatId, anchorMessageId, highlightedText, quickChatHistory, userTier, model } = input;
    const activeModel = model || QUICK_CHAT_MODEL;
  
    const recentHistory = (quickChatHistory || []).slice(-8);

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
      highlightedText
    );

    const contents: IGeminiContent[] = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...recentHistory.map((msg) => ({
        role: (msg.role === "model" ? "model" : "user") as "user" | "model",
        parts: [{ text: msg.content }],
      })),
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

      const quickChatTokens = promptTokens + responseTokens;

      if (quickChatTokens > 0) {
        try {
          const provider = getProviderKey(activeModel);
          await this.userRepo.findByIdAndUpdate(userId, {
            $inc: {
              [`token_usage.${provider}.quickChat.input`]: promptTokens,
              [`token_usage.${provider}.quickChat.output`]: responseTokens,
              [`token_usage.${provider}.quickChat.total`]: quickChatTokens,
              tokensUsed: quickChatTokens,
            },
          });

          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);

          await this.dailyTokenUsageRepository.upsertUsage(userId, today, userTier || "free", {
            [`token_usage.${provider}.quickChat.input`]: promptTokens,
            [`token_usage.${provider}.quickChat.output`]: responseTokens,
            [`token_usage.${provider}.quickChat.total`]: quickChatTokens,
          });

          await this.rateLimitService.incrementCount(userId, "quickChats");
          await this.rateLimitService.incrementTokens(userId, activeModel, quickChatTokens);
        } catch (err) {
          this.logger.error("Failed to update user token usage for quick chat:", err);
        }
      }
    }
  }
}
