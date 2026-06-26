import api from "../../../lib/axios";
import type { Folder } from "../types/Folder";
import type { Chat } from "../../chat/types/Chat";
import type { Message } from "../../chat/types/Message";

export interface CreateSharedLinkPayload {
  targetId: string;
  targetType: "chat" | "folder";
  behaviorSharingPolicy?: "READ_ONLY" | "READ_WRITE" | "INVISIBLE";
}

export interface SharedLink {
  token: string;
  creatorId: string;
  targetId: string;
  targetType: "chat" | "folder";
  behaviorSharingPolicy: "READ_ONLY" | "READ_WRITE" | "INVISIBLE";
}

export interface SharedLinkData {
  targetType: "chat" | "folder";
  folders?: Folder[];
  chats?: Chat[];
  messages?: Message[];
  chat?: Chat;
}

export const createSharedLink = async (payload: CreateSharedLinkPayload): Promise<SharedLink> => {
  const res = await api.post("/share", payload);
  return res.data.data;
};

export const resolveSharedLink = async (token: string, chatId?: string): Promise<SharedLinkData> => {
  const url = chatId ? `/share/resolve/${token}?chatId=${chatId}` : `/share/resolve/${token}`;
  const res = await api.get(url);
  return res.data.data;
};

export const downloadSharedLink = async (token: string, destinationFolderId: string | null): Promise<{ id: string; type: "chat" | "folder" }> => {
  const res = await api.post(`/share/download/${token}`, { destinationFolderId });
  return res.data.data;
};
