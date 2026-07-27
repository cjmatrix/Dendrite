import { IGeminiContent, IAIStreamChunk } from "../../../domain/chat/entities/Gemini";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IMessage } from "../../../domain/chat/entities/Message";

export interface IAIService {
  streamAIContent(
    contents: IGeminiContent[],
    model?: string,
    signal?: AbortSignal,
    userId?: string,
    userTier?: string,
    systemInstruction?: string,
  ): Promise<AsyncIterable<IAIStreamChunk>>;
  getAnchorContext(
    chatId: string,
    anchorMessageId: string,
    messageRepo: IMessageRepository,
  ): Promise<IMessage[]>;
  buildQuickChatSystemPrompt(
    historicalContext: string,
    highlightedText: string,
    mode?: string,
  ): string;
}
