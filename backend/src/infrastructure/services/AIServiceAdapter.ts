import { injectable, inject } from "tsyringe";
import { IAIService } from "../../application/common/ports/IAIService";
import { IMetricsService } from "../../application/common/ports/IMetricsService";
import { AIService } from "../../services/AIService";

@injectable()
export class AIServiceAdapter implements IAIService {
  constructor(
    @inject("IMetricsService") private readonly metricsService: IMetricsService
  ) {}

  async streamAIContent(contents: any[], model?: string,signal?:AbortSignal): Promise<AsyncIterable<any>> {
    const activeModel = model || "gemini-3-flash-preview";
    try {
      const stream = await AIService.streamAIContent(contents, model,signal);
      this.metricsService.incrementAICall("success", activeModel,model==="gemini-3-flash-preview"?"main":"sub");
      return stream;
    } catch (error) {
      this.metricsService.incrementAICall("failure", activeModel,model?"sub":"main");
      throw error;
    }
  }

  async getAnchorContext(chatId: string, anchorMessageId: string, messageRepo: any): Promise<any[]> {
    return AIService.getAnchorContext(chatId, anchorMessageId, messageRepo);
  }

  buildQuickChatSystemPrompt(historicalContext: string, highlightedText: string): string {
    return AIService.buildQuickChatSystemPrompt(historicalContext, highlightedText);
  }
}
