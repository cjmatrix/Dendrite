import { inject, injectable } from "tsyringe";
import {
  ISaveModelReplyUseCase,
  IStreamAndSaveChatUseCase,
  StreamResult,
} from "./interfaces";
import { IAIService } from "../../common/ports/IAIService";
import { ILogger } from "../../common/ports/ILogger";
import { estimateTokenCount } from "../../../utils/tokenCounter";
import { DEFAULT_MODEL } from "../../../constants/models";
import { IRateLimitService } from "../../common/ports/IRateLimitService";

@injectable()
export class StreamAndSaveChatUseCase implements IStreamAndSaveChatUseCase {
  constructor(
    @inject("IAIService") private aiService: IAIService,
    @inject("ISaveModelReplyUseCase")
    private saveModelReplyUseCase: ISaveModelReplyUseCase,
    @inject("ILogger") private logger: ILogger,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService,
  ) {}

  async *execute(
    params: any,
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

    let stream: any;
    
    try {
      stream = await this.aiService.streamAIContent(
        contents,
        activeModel,
        signal,
        userId,
        userTier,
        systemInstruction,
      );
    } catch (error: any) {
      yield { type: "error", value: "Quota Exhausted or AI Error" };
      return;
    }

    const onAbort = () => {
      if (stream && typeof stream.return === "function") {
        stream.return().catch((err: any) => {
          this.logger.error("Error terminating AI stream on abort", err);
        });
      }
    };

    if (signal.aborted) {
      onAbort();
      return;
    }

    signal.addEventListener("abort", onAbort);

    let fullReply = "";
    let finalUsageMetadata: any = null;
    console.log("STarting MY ASYC GENERATOR")
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
          usage: finalUsageMetadata,
          originalMessage,
        },
      };

      try {
        await this.rateLimitService.incrementCount(userId, "mainQueries");
      } catch (err) {
        this.logger.error("Failed to increment rate limit counter for mainQueries", err);
      }
    }
  }
}
