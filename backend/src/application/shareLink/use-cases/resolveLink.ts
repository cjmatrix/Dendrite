import { inject, injectable } from "tsyringe";
import { ISharedLinkRepository } from "../../../domain/shareLink/repositories/ISharedLinkRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { AppError } from "../../../utils/AppError";

@injectable()
export class ResolveLink {
  constructor(
    @inject("ISharedLinkRepository") private shareLinkRepo: ISharedLinkRepository,
    @inject("IChatRepository") private chatRepo: IChatRepository,
    @inject("IMessageRepository") private messageRepo: IMessageRepository,
    @inject("IFolderRepository") private folderRepo: IFolderRepository
  ) {}

  async execute(token: string, chatId?: string): Promise<any> {
    const link = await this.shareLinkRepo.findByToken(token);
    if (!link) {
      throw new AppError("Shared link not found or expired", 404);
    }

    const { targetType, targetId, behaviorSharingPolicy } = link;

    if (targetType === "chat") {
      const chatDoc = await this.chatRepo.findById(targetId);
      if (!chatDoc) {
        throw new AppError("Chat not found", 404);
      }

      const messages = await this.messageRepo.findAllByChatId(targetId);

      return {
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
      };
    } else if (targetType === "folder") {
      const rootFolderDoc = await this.folderRepo.findById(targetId);
      if (!rootFolderDoc) {
        throw new AppError("Folder not found", 404);
      }

      const getDescendants = async (folderId: string): Promise<any[]> => {
        const children = await this.folderRepo.findByParentId(folderId);
        let list = [...children];
        for (const child of children) {
          const subChildren = await getDescendants(child._id.toString());
          list = list.concat(subChildren);
        }
        return list;
      };

      const descendants = await getDescendants(targetId);
      const folderIds = [targetId, ...descendants.map((d) => d._id.toString())];

      let activeChatDoc = null;
      let activeMessages = null;

      if (chatId) {
        // Fetch specific chat messages under the shared folder
        activeChatDoc = await this.chatRepo.findById(chatId);
        if (!activeChatDoc || !activeChatDoc.folderId || !folderIds.includes(activeChatDoc.folderId.toString())) {
          throw new AppError("Chat not found in this shared folder", 404);
        }
        activeMessages = await this.messageRepo.findAllByChatId(chatId);
      }

      // Fetch all chats within these folders
      const chats = await this.chatRepo.findByFolderIdsWithoutUserId(folderIds);

      // Build folder tree mimicking GetFolders.ts logic
      const allFolders = [rootFolderDoc, ...descendants];
      const folderMap = new Map();
      const roots: any[] = [];

      for (const folder of allFolders) {
        folderMap.set(folder._id.toString(), {
          _id: folder._id.toString(),
          id: folder._id.toString(),
          name: folder.name,
          type: 'folder',
          parentId: folder.parentId ? folder.parentId.toString() : null,
          children: [],
          isExpanded: folder.isExpanded || false,
          isSystemFolder: folder.isSystemFolder || false
        });
      }

      for (const folder of allFolders) {
        const node = folderMap.get(folder._id.toString());
        // The root folder of the share should be treated as a root node in our preview tree
        if (folder._id.toString() === rootFolderDoc._id.toString()) {
          roots.push(node);
        } else if (folder.parentId) {
          const parent = folderMap.get(folder.parentId.toString());
          if (parent) {
            parent.children.push(node);
          } else {
            roots.push(node);
          }
        } else {
          roots.push(node);
        }
      }

      return {
        targetType: "folder",
        behaviorSharingPolicy,
        folders: roots,
        chats: chats.map((c: any) => ({
          ...c,
          id: c._id.toString(),
        })),
        chat: activeChatDoc ? { ...activeChatDoc, id: activeChatDoc._id.toString() } : undefined,
        messages: activeMessages ? activeMessages.map((m: any) => ({ ...m, id: m._id.toString() })) : undefined,
      };
    } else {
      throw new AppError("Invalid shareable type", 400);
    }
  }
}
