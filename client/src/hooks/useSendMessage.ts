import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chatRepository } from "../core/container";
import type { StreamChunk, Message } from "../core/domain/entities/Message";

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
  const metadataRef = useRef<{ userMessageId?: string; modelMessageId?: string } | null>(null);

  const send = useCallback(
    async (input: string, imageUrl: string | null) => {
      if (!chatId || (!input.trim() && !imageUrl) || isStreaming) return;

      const userMessage = input.trim();
      const userTempId = `temp-${Date.now()}`;

      // Optimistically add user message to the cache
      queryClient.setQueryData(["chatMessages", chatId], (old: any) => {
        if (!old?.pages?.length) return old;
        const newPages = [...old.pages];
        newPages[0] = {
          ...newPages[0],
          messages: [
            ...newPages[0].messages,
            {
              role: "user",
              content: userMessage || "Analyze this image",
              imageUrl: imageUrl || undefined,
              _id: userTempId,
            } satisfies Message,
          ],
        };
        return { ...old, pages: newPages };
      });

      setIsStreaming(true);
      setStreamingText("");
      metadataRef.current = null;
      onStreamStart?.();

      let fullReply = "";

      try {
        await chatRepository.sendMessageStream(
          chatId,
          userMessage,
          mode,
          imageUrl,
          (chunk: StreamChunk) => {
            if (chunk.type === "metadata") {
              metadataRef.current = chunk;
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
        const metadata = metadataRef.current;

        queryClient.setQueryData(["chatMessages", chatId], (old: any) => {
          if (!old?.pages?.length) return old;
          const newPages = [...old.pages];
          let newMessages = [...newPages[0].messages];

          if (fullReply.trim()) {
            newMessages.push({
              role: "model",
              content: fullReply,
              _id: metadata?.modelMessageId || `temp-ai-${Date.now()}`,
            } satisfies Message);
          }

          // Replace temp user ID with real DB ID
          if (metadata?.userMessageId) {
            newMessages = newMessages.map((m: Message) =>
              m._id === userTempId ? { ...m, _id: metadata.userMessageId } : m,
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
