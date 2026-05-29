import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sendMessageStream } from "../api/chatApi";
import type { StreamChunk, Message } from "../types/Message";

interface UseSendMessageOptions {
  chatId: string | undefined;
  mode: "general" | "visual";
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export function useSendMessage({ chatId, mode, onStreamStart, onStreamEnd }: UseSendMessageOptions) {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();

  const send = useCallback(
    async (input: string, imageUrl: string | null, selectedFile?: { name: string; url: string } | null) => {
      if (!chatId || (!input.trim() && !imageUrl && !selectedFile) || isStreaming) return;

      const userMessage = input.trim();
      const userTempId = `temp-${Date.now()}`;
      const fallbackText = selectedFile ? `Uploaded file: ${selectedFile.name}` : "Analyze this image";

     
      queryClient.setQueryData(["chatMessages", chatId], (old: any) => {
        if (!old?.pages?.length) return old;
        console.log(old?.pages,"Old pages")
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [
            ...newPages[0].messages,
            {
              role: "user",
              content: userMessage || fallbackText,
              imageUrl: imageUrl || undefined,
              fileUrl: selectedFile?.url,
              fileName: selectedFile?.name,
              _id: userTempId,
            } satisfies Message,
          ],
        };
        return { ...old, pages: newPages };
      });

      setIsStreaming(true);
      setStreamingText("");
      let streamUserMessageId: string | undefined;
      let streamModelMessageId: string | undefined;
      onStreamStart?.();

      let fullReply = "";

      try {
        await sendMessageStream(
          chatId,
          userMessage,
          mode,
          imageUrl,
          selectedFile?.url || null,
          selectedFile?.name || null,
          (chunk: StreamChunk) => {
            if (chunk.type === "metadata") {
              streamUserMessageId = chunk.userMessageId;
              streamModelMessageId = chunk.modelMessageId;
              return;
            }
            if (chunk.text) {
              fullReply += chunk.text;
              setStreamingText(fullReply);
            }
          },
        );
      } catch (error) {
        console.error("Streaming error:", error);
      } finally {
        // Finalize: insert AI message into cache
        const modelMessageId = streamModelMessageId;
        const userMessageId = streamUserMessageId;

        queryClient.setQueryData(["chatMessages", chatId], (old: any) => {
          if (!old?.pages?.length) return old;
          const newPages = [...old.pages];
          let newMessages = [...newPages[0].messages];

          if (fullReply.trim()) {
            newMessages.push({
              role: "model",
              content: fullReply,
              _id: modelMessageId || `temp-ai-${Date.now()}`,
            } satisfies Message);
          }

          // Replace temp user ID with real DB ID
          if (userMessageId) {
            newMessages = newMessages.map((m: Message) =>
              m._id === userTempId ? { ...m, _id: userMessageId } : m,
            );
          }

          newPages[0] = { ...newPages[0], messages: newMessages };
          return { ...old, pages: newPages };
        });

        setStreamingText("");
        setIsStreaming(false);
        onStreamEnd?.();
      }
    },
    [chatId, mode, isStreaming, queryClient, onStreamStart, onStreamEnd],
  );

  return { send, isStreaming, streamingText };
}
