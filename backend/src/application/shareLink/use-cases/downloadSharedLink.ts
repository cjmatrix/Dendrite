import { inject, injectable } from "tsyringe";
import { ISharedLinkRepository } from "../../../domain/shareLink/repositories/ISharedLinkRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { IUnitOfWorkRepository } from "../../common/ports/IUnitOfWorkRepository";
import { AppError } from "../../../utils/AppError";
import mongoose from "mongoose";

export interface DownloadSharedLinkInput {
  token: string;
  userId: string;
  destinationFolderId: string | null;
}

@injectable()
export class DownloadSharedLink {
  constructor(
    @inject("ISharedLinkRepository")
    private shareLinkRepo: ISharedLinkRepository,
    @inject("IChatRepository") private chatRepo: IChatRepository,
    @inject("IMessageRepository") private messageRepo: IMessageRepository,
    @inject("IFolderRepository") private folderRepo: IFolderRepository,
    @inject("IUnitOfWorkRepository") private unitOfWork: IUnitOfWorkRepository,
  ) {}

  async execute(
    input: DownloadSharedLinkInput,
  ): Promise<{ success: boolean; type: string; id: string }> {
    const { token, userId, destinationFolderId } = input;

    const link = await this.shareLinkRepo.findByToken(token);
    if (!link || !link.shareRepo) {
      throw new AppError("Shared link not found or expired", 404);
    }

    const { targetType, shareRepo } = link;

    return await this.unitOfWork.runInTransaction(async () => {
      if (destinationFolderId) {
        const parentFolder = await this.folderRepo.findByIdAndUserId(destinationFolderId, userId);
        if (!parentFolder) {
          throw new AppError("Destination folder not found", 404);
        }
      }

      if (targetType === "chat") {
        const snapshotChat = shareRepo.chat;
        if (!snapshotChat) {
          throw new AppError("Shared chat not found in link snapshot", 400);
        }

     
        const existingChat = await this.chatRepo.findByUserIdAndTitleAndFolderId(
          userId,
          snapshotChat.title || "Shared Chat",
          destinationFolderId
        );
        if (existingChat) {
          throw new AppError(`A chat named "${snapshotChat.title}" already exists in the destination folder`, 409);
        }

        const newChatId = new mongoose.Types.ObjectId().toString();
        const chatsToCreate = [{
          _id: newChatId,
          userId,
          folderId: destinationFolderId,
          title: snapshotChat.title,
          summary: snapshotChat.summary,
          type: snapshotChat.type || "normal",
          documents: [] as string[],
          tokenCount: snapshotChat.tokenCount || 0,
          unsummarizedCount: snapshotChat.unsummarizedCount || 0,
          contextParent: null,
        }];

        const snapshotMessages = shareRepo.messages || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messagesToCreate = snapshotMessages.map((m: any) => ({
          chatId: newChatId,
          userId,
          role: m.role,
          content: m.content,
          imageUrl: m.imageUrl,
          fileUrl: m.fileUrl,
          fileName: m.fileName,
        }));

        await this.chatRepo.createMany(chatsToCreate);
        if (messagesToCreate.length > 0) {
          await this.messageRepo.createMany(messagesToCreate);
        }

        return { success: true, type: "chat", id: newChatId.toString() };
      } else if (targetType === "folder") {
        const rootFolder = shareRepo.folders?.[0];
        if (!rootFolder) {
          throw new AppError(
            "Shared folder structure not found in link snapshot",
            400,
          );
        }

        
        const existingFolder = await this.folderRepo.findByUserIdAndNameAndParent(
          userId,
          rootFolder.name || "Shared Folder",
          destinationFolderId
        );
        if (existingFolder) {
          throw new AppError(`A folder named "${rootFolder.name}" already exists in the destination folder`, 409);
        }

     
        const baseTime = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const folderDocs: any[] = [];
        const folderIdMap = new Map<string, mongoose.Types.ObjectId>();

        const rootFolderOriginalId = rootFolder._id;
        const rootFolderNewId = new mongoose.Types.ObjectId();
        folderIdMap.set((rootFolderOriginalId || "").toString(), rootFolderNewId);

        folderDocs.push({
          _id: rootFolderNewId,
          userId,
          name: rootFolder.name,
          parentId: destinationFolderId ? new mongoose.Types.ObjectId(destinationFolderId) : null,
          ownerId: userId,
          color: rootFolder.color || "default",
          isExpanded: rootFolder.isExpanded || false,
          behavior: rootFolder.behavior,
          createdAt: new Date(baseTime),
          updatedAt: new Date(baseTime),
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prepareFolders = (node: any, parentNewId: mongoose.Types.ObjectId) => {
          const originalId = node._id;
          const newId = new mongoose.Types.ObjectId();
          folderIdMap.set(originalId.toString(), newId);

          const index = folderDocs.length;
          folderDocs.push({
            _id: newId,
            userId,
            name: node.name,
            parentId: parentNewId,
            ownerId: userId,
            color: node.color || "default",
            isExpanded: node.isExpanded || false,
            behavior: node.behavior,
            createdAt: new Date(baseTime + index),
            updatedAt: new Date(baseTime + index),
          });

          for (const child of node.children || []) {
            prepareFolders(child, newId);
          }
        };

        for (const child of (rootFolder as { children?: unknown[] }).children || []) {
          prepareFolders(child, rootFolderNewId);
        }

      
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chatDocs: any[] = [];
        const chatIdMap = new Map<string, mongoose.Types.ObjectId>();
        const snapshotChats = shareRepo.chats || [];

        let chatIndex = 0;
        for (const chat of snapshotChats) {
          const originalChatId = chat._id;
          const originalFolderId = chat.folderId;
          const mappedFolderId = originalFolderId ? folderIdMap.get(originalFolderId.toString()) : null;

          if (mappedFolderId) {
            const newChatId = new mongoose.Types.ObjectId();
            chatIdMap.set((originalChatId || "").toString(), newChatId);

            chatDocs.push({
              _id: newChatId,
              userId,
              folderId: mappedFolderId,
              title: chat.title,
              summary: chat.summary,
              type: chat.type || "normal",
              documents: [],
              tokenCount: chat.tokenCount || 0,
              unsummarizedCount: chat.unsummarizedCount || 0,
              contextParent: null,
              createdAt: new Date(baseTime + chatIndex),
              updatedAt: new Date(baseTime + chatIndex),
            });
            chatIndex++;
          }
        }

        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const messageDocs: any[] = [];
        const snapshotMessages = shareRepo.messages || [];

        for (const msg of snapshotMessages) {
          const originalChatId = msg.chatId;
          const mappedChatId = originalChatId ? chatIdMap.get(originalChatId.toString()) : null;

          if (mappedChatId) {
            messageDocs.push({
              chatId: mappedChatId,
              userId,
              role: msg.role,
              content: msg.content,
              imageUrl: msg.imageUrl,
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
            });
          }
        }

        // Execute bulk creation
        if (folderDocs.length > 0) {
          await this.folderRepo.insertMany(folderDocs);
        }
        if (chatDocs.length > 0) {
          await this.chatRepo.createMany(chatDocs);
        }
        if (messageDocs.length > 0) {
          await this.messageRepo.createMany(messageDocs);
        }

        return { success: true, type: "folder", id: rootFolderNewId.toString() };
      } else {
        throw new AppError("Invalid shareable type", 400);
      }
    });
  }
}
