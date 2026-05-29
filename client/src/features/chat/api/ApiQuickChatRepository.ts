import type { IQuickChatRepository, SubChat } from "../../domain/repositories/IQuickChatRepository";
import api from "../../../api/axios";
import { streamingFetch } from "../../../api/streamingFetch";

const API_URL = import.meta.env.VITE_API_URL;

export class ApiQuickChatRepository implements IQuickChatRepository {
  async getSubChat(chatId: string, subChatId: string): Promise<SubChat> {
    const resp = await api.get(`/chats/${chatId}/subchat?subChatId=${subChatId}`);
    return resp.data.data;
  }

  async stickToChat(params: {
    chatId: string;
    subChatId: string;
    anchorMessageId: string;
    highlightedText: string;
    messages: any[];
    relativeY: number;
  }): Promise<void> {
    await api.post(`/chats/${params.chatId}/subchat`, {
      subChatId: params.subChatId,
      anchorMessageId: params.anchorMessageId,
      highlightedText: params.highlightedText,
      messages: params.messages,
      relativeY: params.relativeY,
    });
  }

  async streamQuickChat(params: {
    chatId: string;
    anchorMessageId: string;
    highlightedText: string;
    quickChatHistory: any[];
    onChunk: (textSoFar: string) => void;
  }): Promise<string> {
    const response = await streamingFetch(`${API_URL}/chats/${params.chatId}/quick-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatId: params.chatId,
        anchorMessageId: params.anchorMessageId,
        highlightedText: params.highlightedText,
        quickChatHistory: params.quickChatHistory,
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
  }
}
