import { injectable, inject } from "tsyringe";
import { IAIService } from "../../application/common/ports/IAIService";
import { IMetricsService } from "../../application/common/ports/IMetricsService";
import { AIService } from "../../services/AIService";
import { streamOpenRouterContent } from "../../services/OpenRouterService";
import { isGeminiModel, DEFAULT_MODEL } from "../../constants/models";

@injectable()
export class AIServiceAdapter implements IAIService {
  constructor(
    @inject("IMetricsService") private readonly metricsService: IMetricsService,
    @inject("IUserRepository") private readonly userRepository: any
  ) {}

  async streamAIContent(contents: any[], model?: string, signal?: AbortSignal, userId?: string): Promise<AsyncIterable<any>> {
    const activeModel = model || DEFAULT_MODEL;

    try {
      let stream: AsyncIterable<any>;

      if (isGeminiModel(activeModel)) {
        if (userId) {
          const user = await this.userRepository.findById(userId);
          if (user?.tier === "byok") {
            const { getCachedDecryptedKeys } = require("../../utils/byokKeysHelper");
            const keys = await getCachedDecryptedKeys(userId, "gemini");
            if (keys.length === 0) {
              throw new Error("BYOK tier users must provide their own Gemini API keys. Please upload your keys from the chat window.");
            }
            stream = await AIService.streamAIContentWithKeys(contents, activeModel, keys, signal, userId);
          } else {
            stream = await AIService.streamAIContent(contents, activeModel, signal);
          }
        } else {
          stream = await AIService.streamAIContent(contents, activeModel, signal);
        }
      } else {
        stream = await streamOpenRouterContent(contents, activeModel, signal);
      }

      this.metricsService.incrementAICall("success", activeModel, isGeminiModel(activeModel) ? "main" : "sub");
      return stream;
    } catch (error) {
      this.metricsService.incrementAICall("failure", activeModel, isGeminiModel(activeModel) ? "main" : "sub");
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
