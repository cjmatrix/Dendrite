import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sendMessageStream } from "../api/chatApi";
import type { StreamChunk, Message } from "../types/Message";

interface UseSendMessageOptions {
  chatId: string | undefined;
  mode: "general" | "visual";
  model: string;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
}

export function useSendMessage({
  chatId,
  mode,
  model,
  onStreamStart,
  onStreamEnd,
}: UseSendMessageOptions) {
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const send = useCallback(
    async (
      input: string,
      imageUrl: string | null,
      selectedFile?: { name: string; url: string } | null,
      editMessageId?: string,
    ) => {
      if (
        !chatId ||
        (!input.trim() && !imageUrl && !selectedFile) ||
        isStreaming
      )
        return;

      const userMessage = input.trim();
      const userTempId = `temp-${Date.now()}`;
      const fallbackText = selectedFile
        ? `Uploaded file: ${selectedFile.name}`
        : "Analyze this image";

      queryClient.setQueryData(["chatMessages", chatId], (old: unknown) => {
        const oldData = old as {
          pages: {
            messages: Message[];
            nextCursor: string | null;
          }[];
          pageParams: unknown[];
        } | undefined;

        const existing = oldData?.pages?.length
          ? oldData
          : { pages: [{ messages: [] as Message[], nextCursor: null }], pageParams: [null] };

        let existingPages = [...existing.pages];
        if (editMessageId) {
          existingPages = existingPages.map(page => {
            const index = page.messages.findIndex(m => m._id === editMessageId);
            if (index !== -1) {
              return { ...page, messages: page.messages.slice(0, index) };
            }
            return page;
          });
        }

        const newPages = [...existingPages];
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
        return { ...existing, pages: newPages };
      });

      setIsStreaming(true);
      setStreamingText("");
      let streamUserMessageId: string | undefined;
      let streamModelMessageId: string | undefined;
      onStreamStart?.();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      let fullReply = "";

      try {
        await sendMessageStream(
          chatId,
          userMessage,
          mode,
          model,
          imageUrl,
          selectedFile?.url || null,
          selectedFile?.name || null,
          editMessageId,
          controller,
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
        abortControllerRef.current = null;
        const modelMessageId = streamModelMessageId;
        const userMessageId = streamUserMessageId;

        queryClient.setQueryData(["chatMessages", chatId], (old: unknown) => {
          const oldData = old as {
            pages: {
              messages: Message[];
              nextCursor: string | null;
            }[];
            pageParams: unknown[];
          } | undefined;

          if (!oldData?.pages?.length) return oldData;
          const newPages = [...oldData.pages];
          let newMessages = [...newPages[0].messages];

          if (fullReply.trim()) {
            newMessages.push({
              role: "model",
              content: fullReply,
              _id: modelMessageId || `temp-ai-${Date.now()}`,
            } satisfies Message);
          }

          if (userMessageId) {
            newMessages = newMessages.map((m: Message) =>
              m._id === userTempId ? { ...m, _id: userMessageId } : m,
            );
          }

          newPages[0] = { ...newPages[0], messages: newMessages };
          return { ...oldData, pages: newPages };
        });

        setStreamingText("");
        setIsStreaming(false);
        onStreamEnd?.();
      }
    },
    [chatId, mode, model, isStreaming, queryClient, onStreamStart, onStreamEnd],
  );

  return { send, isStreaming, streamingText ,stopStreaming};
}