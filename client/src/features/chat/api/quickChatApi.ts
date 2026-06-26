import api from "../../../lib/axios";
import { streamingFetch } from "../../../lib/streamingFetch";
import type { Message } from "../types/Message";

const API_URL = import.meta.env.VITE_API_URL;

export interface SubChat {
  subChatId: string;
  anchorMessageId: string;
  highlightedText: string;
  messages: Message[];
  relativeY?: number;
}

export const getSubChat = async (chatId: string, subChatId: string): Promise<SubChat> => {
  const resp = await api.get(`/chats/${chatId}/subchat?subChatId=${subChatId}`);
  return resp.data.data;
};

export const stickToChat = async (params: {
  chatId: string;
  subChatId: string;
  anchorMessageId: string;
  highlightedText: string;
  messages: Message[];
  relativeY: number;
}): Promise<void> => {
  if (!params.anchorMessageId || !params.anchorMessageId.trim()) {
    throw new Error("Anchor message ID is required");
  }
  if (!Array.isArray(params.messages)) {
    throw new Error("Messages must be an array");
  }
  if (typeof params.relativeY !== "number") {
    throw new Error("relativeY must be a number");
  }

  await api.post(`/chats/${params.chatId}/subchat`, {
    subChatId: params.subChatId,
    anchorMessageId: params.anchorMessageId,
    highlightedText: params.highlightedText,
    messages: params.messages,
    relativeY: params.relativeY,
  });
};

export const streamQuickChat = async (params: {
  chatId: string;
  anchorMessageId: string;
  highlightedText: string;
  quickChatHistory: Message[];
  model?: string;
  onChunk: (textSoFar: string) => void;
}): Promise<string> => {
  if (!params.anchorMessageId || !params.anchorMessageId.trim()) {
    throw new Error("Anchor message ID is required");
  }

  const response = await streamingFetch(`${API_URL}/chats/${params.chatId}/quick-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chatId: params.chatId,
      anchorMessageId: params.anchorMessageId,
      highlightedText: params.highlightedText,
      quickChatHistory: params.quickChatHistory,
      model: params.model,
    }),
  });

  if (!response.ok || !response.body) throw new Error("Stream failed");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullReply = "";

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
          fullReply += parsed.text;
          params.onChunk(fullReply);
        } catch {}
      }
    }
  }

  return fullReply;
};
