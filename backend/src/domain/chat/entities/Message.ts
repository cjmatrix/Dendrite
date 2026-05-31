export interface IMessage {
  _id: string;
  chatId: string;
  userId: string;
  role: "user" | "model";
  content: string;
  imageUrl?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
