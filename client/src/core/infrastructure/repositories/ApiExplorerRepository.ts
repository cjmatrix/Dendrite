import type { IFolderRepository, IChatListRepository, IRecallCountRepository } from "../../domain/repositories/IExplorerRepository";
import api from "../../../api/axios";

export class ApiFolderRepository implements IFolderRepository {
  async getFolders() {
    const res = await api.get("/folders");
    return res.data.data;
  }

  async createFolder(name: string, parentId: string | null) {
    await api.post("/folders/create", { name, parentId });
  }

  async updateFolder(folderId: string, updates: { name?: string; isExpanded?: boolean }) {
    await api.patch(`/folders/${folderId}`, updates);
  }

  async deleteFolder(folderId: string) {
    await api.delete(`/folders/${folderId}`);
  }
}

export class ApiChatListRepository implements IChatListRepository {
  async getChats() {
    const res = await api.get("/chats");
    return res.data.data;
  }

  async createChat(title: string, folderId: string | null) {
    await api.post("/chats/create", { title, folderId });
  }

  async updateChat(chatId: string, updates: { title?: string; folderId?: string | null }) {
    await api.patch(`/chats/${chatId}`, updates);
  }

  async deleteChat(chatId: string) {
    await api.delete(`/chats/${chatId}`);
  }
}

export class ApiRecallCountRepository implements IRecallCountRepository {
  async getDueCount(): Promise<number> {
    const res = await api.get("/recall/count");
   
    return res.data.data.count;
  }
}
