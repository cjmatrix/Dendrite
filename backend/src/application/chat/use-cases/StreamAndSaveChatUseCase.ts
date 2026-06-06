import { inject, injectable } from "tsyringe";
import { ISaveModelReplyUseCase, IStreamAndSaveChatUseCase, StreamResult } from "./interfaces";
import { IAIService } from "../../common/ports/IAIService";
import { ILogger } from "../../common/ports/ILogger";

@injectable()
export class StreamAndSaveChatUseCase implements IStreamAndSaveChatUseCase {
  constructor(
    @inject("IAIService") private aiService: IAIService,
    @inject("ISaveModelReplyUseCase") private saveModelReplyUseCase: ISaveModelReplyUseCase,
    @inject("ILogger") private logger: ILogger
  ) {}

  async *execute(params: any, signal: AbortSignal): AsyncGenerator<StreamResult> {
    const { contents, chatId, userId, userMessageId, parentContext, parentSummary, originalMessage } = params;
    
    let stream: any;
    try {
      stream = await this.aiService.streamAIContent(contents, "gemini-3-flash-preview", signal);
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
      const { modelMessageId } = await this.saveModelReplyUseCase.execute({
        chatId, userId, modelReply: fullReply, parentContext, parentSummary
      });

      yield { 
        type: "metadata", 
        value: { userMessageId, modelMessageId, usage: finalUsageMetadata, originalMessage } 
      };
    }
  }
}