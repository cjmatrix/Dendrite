import { inject, injectable } from "tsyringe";
import { ISharedLinkRepository } from "../../../domain/shareLink/repositories/ISharedLinkRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { AppError } from "../../../utils/AppError";

export interface DownloadSharedLinkInput {
  token: string;
  userId: string;
  destinationFolderId: string | null;
}

@injectable()
export class DownloadSharedLink {
  constructor(
    @inject("ISharedLinkRepository") private shareLinkRepo: ISharedLinkRepository,
    @inject("IChatRepository") private chatRepo: IChatRepository,
    @inject("IMessageRepository") private messageRepo: IMessageRepository,
    @inject("IFolderRepository") private folderRepo: IFolderRepository
  ) {}

  async execute(input: DownloadSharedLinkInput): Promise<{ success: boolean; type: string; id: string }> {
    const { token, userId, destinationFolderId } = input;

    const link = await this.shareLinkRepo.findByToken(token);
    if (!link) {
      throw new AppError("Shared link not found or expired", 404);
    }

    const { targetType, targetId } = link;

    if (targetType === "chat") {
      const newChatId = await this.cloneChat(targetId, destinationFolderId, userId);
      return { success: true, type: "chat", id: newChatId };
    } else if (targetType === "folder") {
      const newFolderId = await this.cloneFolder(targetId, destinationFolderId, userId);
      return { success: true, type: "folder", id: newFolderId };
    } else {
      throw new AppError("Invalid shareable type", 400);
    }
  }

  private async cloneFolder(
    folderIdToClone: string,
    newParentId: string | null,
    userId: string
  ): Promise<string> {
    const originalFolder = await this.folderRepo.findById(folderIdToClone);
    if (!originalFolder) {
      throw new AppError("Folder to clone not found", 404);
    }


   
    
    const newFolder = await this.folderRepo.create({
      userId,
      name: originalFolder.name,
      parentId: newParentId,
      ownerId: userId,
      color: originalFolder.color || 'default',
      isExpanded: originalFolder.isExpanded || false,
      behavior: originalFolder.behavior
    });

    const newFolderId = newFolder._id.toString();


    const chats = await this.chatRepo.findByFolderIdsWithoutUserId([folderIdToClone]);
    for (const chat of chats) {
      await this.cloneChat(chat._id.toString(), newFolderId, userId);
    }

   
    const children = await this.folderRepo.findByParentId(folderIdToClone);
    for (const child of children) {
      await this.cloneFolder(child._id.toString(), newFolderId, userId);
    }

    return newFolderId;
  }

  private async cloneChat(chatIdToClone: string, newFolderId: string | null, userId: string): Promise<string> {
    const originalChat = await this.chatRepo.findById(chatIdToClone);
    if (!originalChat) {
      throw new AppError("Chat to clone not found", 404);
    }

  
    const newChat = await this.chatRepo.create({
      userId,
      folderId: newFolderId,
      title: originalChat.title,
      summary: originalChat.summary,
      type: originalChat.type || "normal",
      documents: [],
      tokenCount: originalChat.tokenCount || 0,
      unsummarizedCount: originalChat.unsummarizedCount || 0,
      contextParent: null
    });

    const newChatId = newChat._id.toString();

   
    const messages = await this.messageRepo.findAllByChatId(chatIdToClone);
    if (messages && messages.length > 0) {
      const messagesToCreate = messages.map((m: any) => ({
        chatId: newChatId,
        userId,
        role: m.role,
        content: m.content,
        imageUrl: m.imageUrl,
        fileUrl: m.fileUrl,
        fileName: m.fileName
      }));
      await this.messageRepo.createMany(messagesToCreate);
    }

    return newChatId;
  }
}
