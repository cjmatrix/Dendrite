export interface IAIService {
  streamAIContent(contents: any[], model?: string, signal?: AbortSignal, userId?: string, userTier?: string, systemInstruction?: string): Promise<AsyncIterable<any>>;
  getAnchorContext(chatId: string, anchorMessageId: string, messageRepo: any): Promise<any[]>;
  buildQuickChatSystemPrompt(historicalContext: string, highlightedText: string): string;
}
