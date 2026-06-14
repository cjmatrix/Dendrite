import api from "../../../lib/axios";
import type { Folder } from "../types/Folder";

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
export const getChats = async (): Promise<any[]> => {
  const res = await api.get("/chats");
  return res.data.data;
};

export const createChat = async (title: string, folderId: string | null): Promise<void> => {
  if (!title || !title.trim()) {
    throw new Error("Title is required");
  }
  await api.post("/chats/create", { title, folderId });
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
export const getFolderBehavior = async (folderId: string): Promise<any> => {
  const res = await api.get(`/folders/${folderId}/behavior`);
  return res.data.data;
};

export const updateFolderBehavior = async (folderId: string, content: string): Promise<any> => {
  const res = await api.patch(`/folders/${folderId}/behavior`, { content });
  return res.data.data;
};
