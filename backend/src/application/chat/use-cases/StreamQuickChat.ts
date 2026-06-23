import { injectable, inject } from "tsyringe";
import { cleanLLMResponse } from "../../../utils/cleanResponse";
import { IStreamQuickChatUseCase } from "./interfaces";
import { StreamQuickChatInputDTO } from "../dtos/chat.dto";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IAIService } from "../../common/ports/IAIService";
import { ILogger } from "../../common/ports/ILogger";
import { AppError } from "../../../utils/AppError";
import CONTEXT_WINDOW from "../../../constants/contextWindow";
import { QUICK_CHAT_MODEL, getProviderKey } from "../../../constants/models";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IRateLimitService } from "../../common/ports/IRateLimitService";
import { estimateTokenCount } from "../../../utils/tokenCounter";

@injectable()
export class StreamQuickChat implements IStreamQuickChatUseCase {
  constructor(
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("IAIService") private aiService: IAIService,
    @inject("ILogger") private logger: ILogger,
    @inject("IUserRepository") private userRepo: IUserRepository,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService
  ) {}

  async *execute(input: StreamQuickChatInputDTO, signal?: AbortSignal): AsyncGenerator<any> {
    const { userId, chatId, anchorMessageId, highlightedText, quickChatHistory, userTier, model } = input;
    const activeModel = model || QUICK_CHAT_MODEL;
  
    const recentHistory = (quickChatHistory || []).slice(-8);

    const backgroundContext = await this.aiService.getAnchorContext(
      chatId,
      anchorMessageId,
      this.messageRepository
    );

    const historicalString = backgroundContext
      .map((msg: any) => `[${msg.role}]: ${msg.content}`)
      .join("\n\n");

    const systemPrompt = this.aiService.buildQuickChatSystemPrompt(
      historicalString,
      highlightedText
    );

    const contents = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...recentHistory.map((msg: any) => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [{ text: msg.role === "model" ? cleanLLMResponse(msg.content) : msg.content }],
      })),
    ];

    let stream: any;
    try {
      stream = await this.aiService.streamAIContent(contents, activeModel, signal, userId, userTier);
    } catch (error: any) {
      this.logger.error("AI streaming failed", error, { contents });
      throw new AppError("All your provided Gemini API keys have exceeded their free-tier limits. Please wait, or add a new key.", 429);
    }

    const onAbort = () => {
      if (stream && typeof stream.return === "function") {
        stream.return().catch((err: any) => {
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
    let finalUsageMetadata: any = null;

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

          await this.rateLimitService.incrementCount(userId, "quickChats");
          await this.rateLimitService.incrementTokens(userId, activeModel, quickChatTokens);
        } catch (err) {
          this.logger.error("Failed to update user token usage for quick chat:", err);
        }
      }
    }
  }
}
