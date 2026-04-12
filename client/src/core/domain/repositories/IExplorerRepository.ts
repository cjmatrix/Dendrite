import type { Folder } from "../entities/Folder";

export interface IFolderRepository {

  getFolders(): Promise<Folder[]>;

 
  createFolder(name: string, parentId: string | null): Promise<void>;


  updateFolder(folderId: string, updates: { name?: string; isExpanded?: boolean }): Promise<void>;


  deleteFolder(folderId: string): Promise<void>;
}

export interface IChatListRepository {

  getChats(): Promise<any[]>;


  createChat(title: string, folderId: string | null): Promise<void>;

  
  updateChat(chatId: string, updates: { title?: string; folderId?: string | null }): Promise<void>;


  deleteChat(chatId: string): Promise<void>;
}

export interface IRecallCountRepository {

  getDueCount(): Promise<number>;
}
