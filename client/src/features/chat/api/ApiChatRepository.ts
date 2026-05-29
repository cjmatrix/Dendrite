import type { Chat } from "../../domain/entities/Chat";
import type { MessagePage, StreamChunk } from "../../domain/entities/Message";
import type {
  DocumentProgressEvent,
  DocumentUploadResult,
  ImageUploadResult,
} from "../../domain/entities/FileUpload";
import type { IChatRepository } from "../../domain/repositories/IChatRepository";
import api from "../../../api/axios";
import { streamingFetch } from "../../../api/streamingFetch";

const API_URL = import.meta.env.VITE_API_URL;

export class ApiChatRepository implements IChatRepository {
  async getChat(chatId: string): Promise<Chat> {
    const res = await api.get(`/chats/${chatId}`);
    return res.data.data;
  }

  async getMessages(chatId: string, cursor: string | null, limit: number): Promise<MessagePage> {
    const res = await api.get(`/chats/${chatId}/messages`, {
      params: { cursor, limit },
    });
    return res.data.data;
  }

  async sendMessageStream(
    chatId: string,
    message: string,
    mode: "general" | "visual",
    imageUrl: string | null,
    fileUrl: string | null,
    fileName: string | null,
    onChunk: (chunk: StreamChunk) => void,
  ): Promise<void> {
    const response = await streamingFetch(`${API_URL}/chats/${chatId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, mode, imageUrl, fileUrl, fileName }),
    });

    if (!response.ok || !response.body) {
      throw new Error("Stream failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            onChunk(parsed);
          } catch {
            
          }
        }
      }
    }
  }

  async uploadImage(file: File, chatId?: string): Promise<ImageUploadResult> {
    const formData = new FormData();
    formData.append("image", file);
    if (chatId) {
      formData.append("chatId", chatId);
    }
    const res = await api.post("/chats/upload-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { type: "image", url: res.data.data.url };
  }

  async uploadFile(
    file: File,
    chatId?: string,
    fileName?: string,
  ): Promise<DocumentUploadResult> {
    if (!chatId) {
      throw new Error("Chat ID is required for document uploads");
    }
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) {
      formData.append("fileName", fileName);
    }
    const res = await api.post(`/chats/${chatId}/upload-file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      type: "document",
      documentId: res.data.data.documentId,
      fileName: res.data.data.fileName,
      status: res.data.data.status,
    };
  }

  streamDocumentProgress(
    chatId: string,
    documentId: string,
    onEvent: (event: DocumentProgressEvent) => void,
    onError?: () => void,
  ): () => void {
    const url = `${API_URL}/chats/${chatId}/documents/${documentId}/progress`;
    const source = new EventSource(url, { withCredentials: true });

    const onProgress = (messageEvent: MessageEvent) => {
      try {
        const parsed = JSON.parse(messageEvent.data) as DocumentProgressEvent;
        onEvent(parsed);
      } catch (error) {
        console.error("[DocumentProgress] Failed to parse event payload", error);
      }
    };

    source.addEventListener("progress", onProgress);
    source.addEventListener("error", () => {
      onError?.();
    });

    return () => {
      source.removeEventListener("progress", onProgress);
      source.close();
    };
  }
}
