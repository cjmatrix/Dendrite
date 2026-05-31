export interface ISubChatMessage {
  _id?: string;
  role: "user" | "model";
  content: string;
}

export interface ISubChat {
  _id: string;
  chatId: string;
  anchorMessageId: string;
  userId: string;
  highlightedText: string;
  relativeY: number;
  messages: ISubChatMessage[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
