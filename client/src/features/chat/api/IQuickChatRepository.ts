import type { Message } from "../types/Message";

export interface SubChat {
  messages: Message[];
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
    messages: Message[];
    relativeY: number;
  }): Promise<void>;


  streamQuickChat(params: {
    chatId: string;
    anchorMessageId: string;
    highlightedText: string;
    quickChatHistory: Message[];
    model?: string;
    onChunk: (textSoFar: string) => void;
  }): Promise<string>;
}
