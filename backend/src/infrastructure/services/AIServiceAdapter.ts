import { injectable } from "tsyringe";
import { IAIService } from "../../application/common/ports/IAIService";
import { AIService } from "../../services/AIService";

@injectable()
export class AIServiceAdapter implements IAIService {
  async streamAIContent(contents: any[], model?: string): Promise<AsyncIterable<any>> {
    return AIService.streamAIContent(contents, model);
  }

  async getAnchorContext(chatId: string, anchorMessageId: string, messageRepo: any): Promise<any[]> {
    return AIService.getAnchorContext(chatId, anchorMessageId, messageRepo);
  }

  buildQuickChatSystemPrompt(historicalContext: string, highlightedText: string): string {
    return AIService.buildQuickChatSystemPrompt(historicalContext, highlightedText);
  }
}
