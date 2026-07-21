import api from "../../../lib/axios";
import { streamingFetch } from "../../../lib/streamingFetch";
import type { Chat } from "../types/Chat";
import type { MessagePage, StreamChunk } from "../types/Message";
import type { DocumentProgressEvent, DocumentUploadResult, ImageUploadResult } from "../types/FileUpload";
import { MODEL_OPTIONS } from "../constants/models";

const API_URL = import.meta.env.VITE_API_URL;

export const getChat = async (chatId: string): Promise<Chat> => {
  const res = await api.get(`/chats/${chatId}`);
  return res.data.data;
};

export const getMessages = async (chatId: string, cursor: string | null, limit: number): Promise<MessagePage> => {
  const res = await api.get(`/chats/${chatId}/messages`, {
    params: { cursor, limit },
  });
  return res.data.data;
};

export const sendAgentMessage=async( 
  chatId: string|undefined,
  message: string,
)=>{
  const res=await api.post(`/agents/workspace/${chatId}`,{
    message
  })
  return res.data
}
  


export const sendMessageStream = async (
  chatId: string,
  message: string,
  mode: "general" | "visual",
  model: string,
  imageUrl: string | null,
  fileUrl: string | null,
  fileName: string | null,
  editMessageId: string | undefined,
  controller:AbortController,
  onChunk: (chunk: StreamChunk) => void,
): Promise<void> => {
  if (!message?.trim() && !imageUrl?.trim() && !fileUrl?.trim()) {
    throw new Error("At least one of message, imageUrl, or fileUrl must be provided");
  }
  if (model) {
    const isValidModel = MODEL_OPTIONS.some((m) => m.id === model);
    if (!isValidModel) {
      throw new Error("Invalid model selected");
    }
  }



  const response = await streamingFetch(`${API_URL}/chats/${chatId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, model, imageUrl, fileUrl, fileName, editMessageId }),
  },controller);

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
};

export const uploadImage = async (file: File, chatId?: string): Promise<ImageUploadResult> => {
  const formData = new FormData();
  formData.append("image", file);
  if (chatId) {
    formData.append("chatId", chatId);
  }
  const res = await api.post("/chats/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { type: "image", url: res.data.data.url };
};

export const uploadFile = async (
  file: File,
  chatId?: string,
  fileName?: string,
): Promise<DocumentUploadResult> => {
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
};

export const streamDocumentProgress = (
  chatId: string,
  documentId: string,
  onEvent: (event: DocumentProgressEvent) => void,
  onError?: () => void,
): () => void => {
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

  const onDone = (messageEvent: MessageEvent) => {
    try {
      const parsed = JSON.parse(messageEvent.data) as DocumentProgressEvent;
      onEvent(parsed);
    } catch (error) {
      console.error("[DocumentProgress] Failed to parse done payload", error);
    }
    source.close();
  };

  source.addEventListener("progress", onProgress);
  source.addEventListener("done", onDone);
  source.addEventListener("error", () => {
    onError?.();
  });

  return () => {
    source.removeEventListener("progress", onProgress);
    source.removeEventListener("done", onDone);
    source.close();
  };
};
