export interface SubChat {
  messages: any[];
  highlightedText?: string;
  relativeY?: number;
}

export interface IQuickChatRepository {
 
  getSubChat(chatId: string, subChatId: string): Promise<SubChat>;

 
  stickToChat(params: {
    chatId: string;
    subChatId: string;
    anchorMessageId: string;
    highlightedText: string;
    messages: any[];
    relativeY: number;
  }): Promise<void>;


  streamQuickChat(params: {
    chatId: string;
    anchorMessageId: string;
    highlightedText: string;
    quickChatHistory: any[];
    model?: string;
    onChunk: (textSoFar: string) => void;
  }): Promise<string>;
}
