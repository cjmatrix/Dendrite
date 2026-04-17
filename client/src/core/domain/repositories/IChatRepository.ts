import type { Chat } from "../entities/Chat";
import type { MessagePage, StreamChunk } from "../entities/Message";
import type { UploadResult } from "../entities/FileUpload";

export interface IChatRepository {

  getChat(chatId: string): Promise<Chat>;


  getMessages(chatId: string, cursor: string | null, limit: number): Promise<MessagePage>;


  sendMessageStream(
    chatId: string,
    message: string,
    mode: "general" | "visual",
    imageUrl: string | null,
    fileUrl: string | null,
    fileName: string | null,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void>;


  uploadImage(file: File): Promise<UploadResult>;


  uploadFile(file: File): Promise<UploadResult>;
}

export interface IRecallRepository {

  saveRecallCard(content: string | null, chatId: string, msgId: string): Promise<void>;
}

export interface IBranchRepository {

  inheritContext(chatId: string, contextParentId: string): Promise<void>;
  unlinkInheritance(chatId: string): Promise<void>;
}
