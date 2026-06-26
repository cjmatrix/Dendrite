export interface SubChat {
  subChatId: string;
  relY: number;
  highlightedText?: string;
}

export interface Message {
  _id?: string;
  chatId?: string;
  role: "user" | "model" | "system";
  content: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  hasSubChat?: boolean;
  subChats?: SubChat[];
}

export interface MessagePage {
  messages: Message[];
  nextCursor: string | null;
}

export interface StreamChunk {
  type?: "metadata" | "text";
  text?: string;
  userMessageId?: string;
  modelMessageId?: string;
}
