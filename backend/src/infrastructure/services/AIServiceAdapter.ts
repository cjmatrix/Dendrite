import { injectable, inject } from "tsyringe";
import { IAIService } from "../../application/common/ports/IAIService";
import { IMetricsService } from "../../application/common/ports/IMetricsService";
import { AIService } from "../../services/AIService";
import { streamOpenRouterContent } from "../../services/OpenRouterService";
import { isGeminiModel, DEFAULT_MODEL } from "../../constants/models";
import { getCachedDecryptedKeys } from "../../utils/byokKeysHelper";
import { IUserRepository } from "../../domain/auth/repositories/IUserRepository";
import { IGeminiContent, IAIStreamChunk } from "../../domain/chat/entities/Gemini";
import { IMessageRepository } from "../../domain/chat/repositories/IMessageRepository";
import { IMessage } from "../../domain/chat/entities/Message";

@injectable()
export class AIServiceAdapter implements IAIService {
  constructor(
    @inject("IMetricsService") private readonly metricsService: IMetricsService,
    @inject("IUserRepository") private readonly userRepository: IUserRepository
  ) {}

  async streamAIContent(
    contents: IGeminiContent[],
    model?: string,
    signal?: AbortSignal,
    userId?: string,
    userTier?: string,
    systemInstruction?: string
  ): Promise<AsyncIterable<IAIStreamChunk>> {
    const activeModel = model || DEFAULT_MODEL;

    try {
      let stream: AsyncIterable<IAIStreamChunk>;

      if (isGeminiModel(activeModel)) {
        if (userId) {
          const tier = userTier;
          if (tier === "byok") {
            const keys = await getCachedDecryptedKeys(userId, "gemini");
            if (keys.length === 0) {
              throw new Error("BYOK tier users must provide their own Gemini API keys. Please upload your keys from the chat window.");
            }
            console.log("STARTING WITH KEYS")
            stream = await AIService.streamAIContentWithKeys(contents, activeModel, keys, signal, userId, systemInstruction);
          } else {
            console.log("STARTING WITHOUT KEYS")
            stream = await AIService.streamAIContent(contents, activeModel, signal, systemInstruction);
          }
        } else {
          stream = await AIService.streamAIContent(contents, activeModel, signal, systemInstruction);
        }
      } else if (activeModel.startsWith("groq/")) {
        stream = await AIService.streamGroqContent(contents, activeModel, signal, systemInstruction);
      } else {
        stream = (await streamOpenRouterContent(contents, activeModel, signal, systemInstruction)) as unknown as AsyncIterable<IAIStreamChunk>;
      }

      this.metricsService.incrementAICall("success", activeModel, isGeminiModel(activeModel) ? "main" : "sub");
      return stream;
    } catch (error) {
      this.metricsService.incrementAICall("failure", activeModel, isGeminiModel(activeModel) ? "main" : "sub");
      throw error;
    }
  }

  async getAnchorContext(
    chatId: string,
    anchorMessageId: string,
    messageRepo: IMessageRepository
  ): Promise<IMessage[]> {
    return AIService.getAnchorContext(chatId, anchorMessageId, messageRepo);
  }

  buildQuickChatSystemPrompt(historicalContext: string, highlightedText: string): string {
    return AIService.buildQuickChatSystemPrompt(historicalContext, highlightedText);
  }
}
