import { inject, injectable } from "tsyringe";
import {
  ISaveModelReplyUseCase,
  IStreamAndSaveChatUseCase,
  StreamResult,
  IStreamAndSaveChatParams,
} from "./interfaces";
import { IAIService } from "../../common/ports/IAIService";
import { ILogger } from "../../common/ports/ILogger";
import { estimateTokenCount } from "../../../utils/tokenCounter";
import { DEFAULT_MODEL } from "../../../constants/models";
import { IRateLimitService } from "../../common/ports/IRateLimitService";
import {
  IAIStreamChunk,
  IGeminiUsageMetadata,
} from "../../../domain/chat/entities/Gemini";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";

@injectable()
export class StreamAndSaveChatUseCase implements IStreamAndSaveChatUseCase {
  constructor(
    @inject("IAIService") private aiService: IAIService,
    @inject("ISaveModelReplyUseCase")
    private saveModelReplyUseCase: ISaveModelReplyUseCase,
    @inject("IMessageRepository")
    private messageRepository: IMessageRepository,
    @inject("ILogger") private logger: ILogger,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService,
  ) {}

  async *execute(
    params: IStreamAndSaveChatParams,
    signal: AbortSignal,
  ): AsyncGenerator<StreamResult> {
    const {
      contents,
      chatId,
      userId,
      userTier,
      userMessageId,
      parentContext,
      parentSummary,
      originalMessage,
      model,
      systemInstruction,
    } = params;
    const activeModel = model || DEFAULT_MODEL;

    let stream: AsyncIterable<IAIStreamChunk> | null = null;

    try {
      stream = await this.aiService.streamAIContent(
        contents,
        activeModel,
        signal,
        userId,
        userTier,
        systemInstruction,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      yield {
        type: "error",
        value:
          error instanceof Error
            ? error.message
            : "Quota Exhausted or AI Error",
      };
      return;
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

    if (signal.aborted) {
      onAbort();
      if (userMessageId) {
        try {
          await this.messageRepository.deleteById(userMessageId);
          this.logger.info("Deleted user message from DB on early abort", { userMessageId });
        } catch (err) {
          this.logger.error("Failed to delete user message on early abort", err, { userMessageId });
        }
      }
      return;
    }

    signal.addEventListener("abort", onAbort);

    let fullReply = "";
    let finalUsageMetadata: IGeminiUsageMetadata | null = null;
    console.log("STarting MY ASYC GENERATOR");
    try {
      for await (const chunk of stream) {
        if (signal.aborted) break;

        const text = chunk.text || "";
        fullReply += text;
        if (chunk.usageMetadata) finalUsageMetadata = chunk.usageMetadata;

        yield { type: "text", value: text };
      }
    } catch (err) {
      this.logger.error("Stream interrupted", err);
    } finally {
      signal.removeEventListener("abort", onAbort);
    }

    if (!signal.aborted && fullReply.trim()) {
      let promptTokens = 0;
      let responseTokens = 0;

      if (finalUsageMetadata) {
        console.log("[CACHE DEBUG] Raw usageMetadata:", JSON.stringify(finalUsageMetadata, null, 2));
        const cachedTokens = (finalUsageMetadata as any)
          .cachedContentTokenCount;
        
        if (cachedTokens && cachedTokens > 0) {
          console.log(`✅ Cache Hit! Saved: ${cachedTokens} cached tokens out of ${finalUsageMetadata.promptTokenCount} prompt tokens`);
        } else {
          console.log(`❌ Cache Miss (prompt: ${finalUsageMetadata.promptTokenCount} tokens, response: ${finalUsageMetadata.candidatesTokenCount} tokens)`);
        }
        promptTokens = finalUsageMetadata.promptTokenCount || 0;
        responseTokens = finalUsageMetadata.candidatesTokenCount || 0;
      } else {
        let promptText = "";
        if (contents && Array.isArray(contents)) {
          for (const content of contents) {
            if (content.parts && Array.isArray(content.parts)) {
              for (const part of content.parts) {
                promptText += part.text || "";
              }
            }
          }
        }
        promptTokens = estimateTokenCount(promptText);
        responseTokens = estimateTokenCount(fullReply);
      }

      const { modelMessageId } = await this.saveModelReplyUseCase.execute({
        chatId,
        userId,
        modelReply: fullReply,
        parentContext,
        parentSummary,
        promptTokens,
        responseTokens,
        contents,
        model: activeModel,
      });

      yield {
        type: "metadata",
        value: {
          userMessageId,
          modelMessageId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          usage: finalUsageMetadata as any,
          originalMessage,
        },
      };

      try {
        await this.rateLimitService.incrementCount(userId, "mainQueries");
      } catch (err) {
        this.logger.error(
          "Failed to increment rate limit counter for mainQueries",
          err,
        );
      }
    } else if (signal.aborted) {

      onAbort();
      if (userMessageId) {
        try {
          await this.messageRepository.deleteById(userMessageId);
          this.logger.info("Deleted user message from DB on stream abort", { userMessageId });
        } catch (err) {
          this.logger.error("Failed to delete user message on stream abort", err, { userMessageId });
        }
      }
    }
  }
}
