import api from "../../../lib/axios";
import type { Folder } from "../types/Folder";
import type { Chat } from "../../chat/types/Chat";
import type { FolderBehaviorData, SearchItem } from "../types/types";

// Folders
export const getFolders = async (): Promise<Folder[]> => {
  const res = await api.get("/folders");
  return res.data.data;
};

export const createFolder = async (name: string, parentId: string | null): Promise<void> => {
  await api.post("/folders/create", { name, parentId });
};

export const updateFolder = async (folderId: string, updates: { name?: string; isExpanded?: boolean; parentId?: string | null }): Promise<void> => {
  await api.patch(`/folders/${folderId}`, updates);
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  await api.delete(`/folders/${folderId}`);
};

// Chats
export const getChats = async (): Promise<Chat[]> => {
  const res = await api.get("/chats");
  return res.data.data;
};

export const createChat = async (title: string, folderId: string | null,type?:string): Promise<void> => {
  if (!title || !title.trim()) {
    throw new Error("Title is required");
  }
  await api.post("/chats/create", { title, folderId ,type});
};

export const updateChat = async (chatId: string, updates: { title?: string; folderId?: string | null }): Promise<void> => {
  if (updates.title !== undefined && !updates.title.trim()) {
    throw new Error("Title cannot be empty");
  }
  if (updates.title === undefined && updates.folderId === undefined) {
    throw new Error("At least one update field (title or folderId) must be provided");
  }
  await api.patch(`/chats/${chatId}`, updates);
};

export const deleteChat = async (chatId: string): Promise<void> => {
  await api.delete(`/chats/${chatId}`);
};

// Recall Count
export const getDueCount = async (): Promise<number> => {
  const res = await api.get("/recall/count");
  return res.data.data.count;
};

// Folder Behavior
export const getFolderBehavior = async (folderId: string): Promise<FolderBehaviorData> => {
  const res = await api.get(`/folders/${folderId}/behavior`);
  return res.data.data;
};

export const updateFolderBehavior = async (folderId: string, content: string): Promise<{ success: boolean }> => {
  const res = await api.patch(`/folders/${folderId}/behavior`, { content });
  return res.data.data;
};

export const searchExplorer = async (params: { q: string; type?: "all" | "folder" | "chat" | "agent"; folderId?: string }): Promise<SearchItem[]> => {
  const query = new URLSearchParams();
  if (params.q) query.append("q", params.q);
  if (params.type) query.append("type", params.type);
  if (params.folderId) query.append("folderId", params.folderId);
  const res = await api.get(`/folders/search?${query.toString()}`);
  return res.data.data;
};
