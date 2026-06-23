import { inject, injectable } from "tsyringe";
import crypto from "crypto";
import { ISharedLinkRepository } from "../../../domain/shareLink/repositories/ISharedLinkRepository";
import { ISharedLink } from "../../../domain/shareLink/entities/ShareLink";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { AppError } from "../../../utils/AppError";

@injectable()
export class CreateLink {
  constructor(
    @inject("ISharedLinkRepository")
    private shareLinkRepo: ISharedLinkRepository,
    @inject("IChatRepository") private chatRepo: IChatRepository,
    @inject("IMessageRepository") private messageRepo: IMessageRepository,
    @inject("IFolderRepository") private folderRepo: IFolderRepository,
  ) {}

  async execute(input: {
    userId: string;
    creatorId: string;
    targetId: string;
    targetType: "chat" | "folder";
    behaviorSharingPolicy?: "READ_ONLY" | "READ_WRITE" | "INVISIBLE";
  }): Promise<any> {
    const token = crypto.randomBytes(32).toString("hex");

    const { userId, targetType, targetId, behaviorSharingPolicy } = input;

    if (targetType === "chat") {
      const chatDoc = await this.chatRepo.findById(targetId);
      if (!chatDoc) {
        throw new AppError("Chat not found", 404);
      }

      const messages = await this.messageRepo.findAllByChatId(targetId);

      const link: ISharedLink = {
        creatorId: input.creatorId,
        targetId: input.targetId,
        targetType: input.targetType,
        token,
        behaviorSharingPolicy: input.behaviorSharingPolicy || "READ_ONLY",
        shareRepo: {
          targetType: "chat",
          behaviorSharingPolicy,
          chat: {
            ...chatDoc,
            id: chatDoc._id.toString(),
          },
          messages: messages.map((m: any) => ({
            ...m,
            id: m._id.toString(),
          })),
        },
      };

      await this.shareLinkRepo.create(link);
      return link;
    } else if (targetType === "folder") {
      const rootFolderDoc = await this.folderRepo.findById(targetId);
      if (!rootFolderDoc) {
        throw new AppError("Folder not found", 404);
      }


      let activeChatDoc = null;
      let activeMessages = null;

      const subtree = await this.folderRepo.findFolderSubtree(targetId);

      if (!subtree) {
        throw new AppError("Folder not found", 404);
      }

      const allFolders = [subtree, ...subtree.descendants];
      const folderIds = [
        targetId,
        ...subtree.descendants.map((d: any) => d._id.toString()),
      ];

      const chats = await this.chatRepo.findByFolderIdsWithoutUserId(folderIds);
      const folderMap = new Map();

      for (const folder of allFolders) {
        folderMap.set(folder._id.toString(), {
          _id: folder._id.toString(),
          id: folder._id.toString(),
          name: folder.name,
          type: "folder",
          parentId: folder.parentId?.toString() || null,
          children: [],
          isExpanded: folder.isExpanded || false,
          isSystemFolder: folder.isSystemFolder || false,
        });
      }

      let targetRoot = null;

      for (const folder of allFolders) {
        const node = folderMap.get(folder._id.toString());

        if (folder._id.toString() === targetId) {
          targetRoot = node;
        }

        if (folder.parentId) {
          const parent = folderMap.get(folder.parentId.toString());

          if (parent) {
            parent.children.push(node);
          }
        }
      }
      const chatIds = chats.map((d: any) => d._id.toString());
      const messages = await this.messageRepo.findAllByChatIds(chatIds);
      
      const link: ISharedLink = {
        creatorId: input.creatorId,
        targetId: input.targetId,
        targetType: input.targetType,
        token,
        behaviorSharingPolicy: input.behaviorSharingPolicy || "READ_ONLY",
        shareRepo: {
          targetType: "folder",
          behaviorSharingPolicy,
          folders: [targetRoot],
          chats: chats.map((c: any) => ({
            ...c,
            id: c._id.toString(),
          })),
          messages: messages.map((m: any) => ({
            ...m,
            id: m._id.toString(),
          })),
        },
      };

      await this.shareLinkRepo.create(link);
      return link;
    }
  }
}
