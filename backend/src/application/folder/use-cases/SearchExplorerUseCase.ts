import { injectable, inject } from "tsyringe";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IFolder } from "../../../domain/folder/entities/Folder";
import { IChat } from "../../../domain/chat/entities/Chat";

export interface SearchExplorerInput {
  userId: string;
  query: string;
  type?: "all" | "folder" | "chat" | "agent";
  folderId?: string;
}

export interface SearchResultItem {
  id: string;
  name: string;
  type: "folder" | "chat" | "agent";
  parentId: string | null;
  breadcrumbs: { id: string; name: string }[];
  color?: string;
  isSystemFolder?: boolean;
  createdAt: Date | string;
}

@injectable()
export class SearchExplorerUseCase {
  constructor(
    @inject("IFolderRepository") private folderRepository: IFolderRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository
  ) {}

  public async execute(input: SearchExplorerInput): Promise<SearchResultItem[]> {
    const { userId, query, type = "all", folderId } = input;
    
    
    const allFolders = await this.folderRepository.findAllByUserId(userId);
    const folderMap = new Map<string, IFolder>();
    allFolders.forEach(f => folderMap.set(f._id, f));

   
    let allowedFolderIds: Set<string> | null = null;
    if (folderId) {
      allowedFolderIds = new Set<string>();
      allowedFolderIds.add(folderId);
      
      const getDescendants = (parentId: string) => {
        allFolders.forEach(f => {
          if (f.parentId === parentId && !allowedFolderIds!.has(f._id)) {
            allowedFolderIds!.add(f._id);
            getDescendants(f._id);
          }
        });
      };
      getDescendants(folderId);
    }

    const searchRegex = new RegExp(query, "i");
    const results: SearchResultItem[] = [];


    const getBreadcrumbs = (itemFolderId: string | null): { id: string; name: string }[] => {
      const breadcrumbs: { id: string; name: string }[] = [];
      let currentId = itemFolderId;
      while (currentId && folderMap.has(currentId)) {
        const folder = folderMap.get(currentId)!;
        breadcrumbs.unshift({ id: folder._id, name: folder.name });
        currentId = folder.parentId;
      }
      return breadcrumbs;
    };

   
    if (type === "all" || type === "folder") {
      allFolders.forEach(folder => {
        if (allowedFolderIds && !allowedFolderIds.has(folder._id)) return;
        if (!searchRegex.test(folder.name)) return;

        results.push({
          id: folder._id,
          name: folder.name,
          type: "folder",
          parentId: folder.parentId,
          breadcrumbs: getBreadcrumbs(folder.parentId), 
          color: folder.color,
          isSystemFolder: folder.isSystemFolder,
          createdAt: folder.createdAt || new Date(),
        });
      });
    }

 
    if (type === "all" || type === "chat" || type === "agent") {
      const allChats = await this.chatRepository.findAllByUserId(userId);
      allChats.forEach(chat => {
        if (allowedFolderIds && (!chat.folderId || !allowedFolderIds.has(chat.folderId))) return;
        
        const chatType = chat.type === "agent" ? "agent" : "chat";
        if (type !== "all" && type !== chatType) return;
        if (!searchRegex.test(chat.title)) return;

        results.push({
          id: chat._id,
          name: chat.title,
          type: chatType,
          parentId: chat.folderId,
          breadcrumbs: getBreadcrumbs(chat.folderId),
          createdAt: chat.createdAt || new Date(),
        });
      });
    }

   
    results.sort((a, b) => a.name.localeCompare(b.name));

    return results;
  }
}
