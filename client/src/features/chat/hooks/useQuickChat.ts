import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubChat, stickToChat, streamQuickChat } from "../api/quickChatApi";
import { saveRecallCard } from "../api/recallApi";
import type { Message } from "../types/Message";
import { getMarkdownFromDOMSelection } from "../../../utils/markdownUtils";

import toast from "react-hot-toast";

interface UseQuickChatParams {
  chatId: string | undefined;
  sourceMessageId: string;
  selectedText: string;
  subChatId?: string;
  relativeY?: number;
  isOpen: boolean;
  initialModel?: string;
}

export function useQuickChat({
  chatId,
  sourceMessageId,
  selectedText,
  subChatId,
  relativeY,
  isOpen,
}: UseQuickChatParams) {
  const [model, setModel] = useState("DEFAULT");
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [subMessages, setSubMessages] = useState<Message[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isRecalling, setIsRecalling] = useState(false);
  const [recallSelection, setRecallSelection] = useState<{
    markdown: string;
    x: number;
    y: number;
    bottomY: number;
    msgIndex: number;
    visible: boolean;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);




 
  const { data: existingSubChat, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["subchat", chatId, sourceMessageId, subChatId],
    queryFn: () => getSubChat(chatId!, subChatId!),
    enabled: !!chatId && !!sourceMessageId && isOpen && !!subChatId,
  });









  useEffect(() => {
    if (isHistoryLoading) {
      setSubMessages([]);
      return;
    }
    if (existingSubChat?.messages) {
      setSubMessages(existingSubChat.messages);
    } else {
      setSubMessages([]);
    }
  }, [existingSubChat, isHistoryLoading, sourceMessageId]);

  useEffect(() => {
    if (!subMessages.length && selectedText) {
      setInput(`Explain what is ${selectedText}`);
    }
  }, [selectedText, subMessages.length]);








 
  const stickToChatMutation = useMutation({
    mutationFn: async () => {
      await stickToChat({
        chatId: chatId!,
        subChatId: subChatId!,
        anchorMessageId: sourceMessageId,
        highlightedText: selectedText,
        messages: subMessages,
        relativeY: relativeY || existingSubChat?.relativeY || 0,
      });
    },
    onSuccess: () => {
      setIsPinned(true);
      queryClient.invalidateQueries({ queryKey: ["subchat", chatId, sourceMessageId, subChatId] });
      queryClient.invalidateQueries({ queryKey: ["chatMessages", chatId] });
      toast.success("Chat pinned successfully!");
    },
    onError: (err) => {
      console.error("Failed to pin chat", err);
      toast.error("Failed to pin chat");
    },
  });




  const streamChatMutation = useMutation({
    mutationFn: async ({ userPrompt }: { userPrompt: string }) => {
      return streamQuickChat({
        chatId: chatId!,
        anchorMessageId: sourceMessageId,
        highlightedText: selectedText,
        quickChatHistory: subMessages.concat({ role: "user", content: userPrompt }),
        model: model,
        onChunk: (textSoFar) => setStreamingText(textSoFar),
      });
    },
    onMutate: async ({ userPrompt }) => {
      setStreamingText("");
      setSubMessages((prev) => [...prev, { role: "user", content: userPrompt, _id: `temp-${Date.now()}` }]);
    },
    onSuccess: (finalReply) => {
      setSubMessages((prev) => [
        ...prev,
        { role: "model", content: finalReply, _id: `temp-ai-${Date.now()}` },
      ]);
    },
    onSettled: () => {
      setStreamingText("");
    },
  });

  const prevMessagesLength = useRef(subMessages.length);
  const prevIsPending = useRef(false);

  useEffect(() => {
    const messagesChanged = subMessages.length !== prevMessagesLength.current;
    const streamStarted = streamChatMutation.isPending && !prevIsPending.current;

    if (messagesChanged || streamStarted) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 50);
    }

    prevMessagesLength.current = subMessages.length;
    prevIsPending.current = streamChatMutation.isPending;
  }, [subMessages, streamChatMutation.isPending]);

  // Handlers ─────────────────────────────────────


  const handleSend = () => {
    if (!input.trim() || streamChatMutation.isPending) return;
    const userPrompt = input.trim();
    setInput("");
    streamChatMutation.mutate({ userPrompt });
  };

  const processSubChatSelection = () => {
    const sel = window.getSelection();
    const selectedStr = sel?.toString().trim();

    if (selectedStr && selectedStr.length > 0) {
      let range;
      try {
        range = sel?.getRangeAt(0);
      } catch {
        return;
      }
      const rect = range?.getBoundingClientRect();

      let insideModal = false;
      let curr: HTMLElement | null = sel?.anchorNode?.parentElement || null;
      let msgIndex = -1;
      while (curr && curr !== document.body) {
        if (curr.dataset?.subchatMsgIndex !== undefined) {
          msgIndex = parseInt(curr.dataset.subchatMsgIndex, 10);
        }
        if (curr.dataset?.subchatMessages !== undefined) {
          insideModal = true;
          break;
        }
        curr = curr.parentElement;
      }

      if (rect && rect.width > 0 && insideModal && msgIndex >= 0) {
        const capturedMarkdown = getMarkdownFromDOMSelection() || selectedStr;
        setRecallSelection({
          markdown: capturedMarkdown,
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
          bottomY: rect.bottom + window.scrollY,
          msgIndex,
          visible: true,
        });
      }
    } else {
      setRecallSelection((prev) => (prev ? { ...prev, visible: false } : null));
    }
  };

 
  const handleSubChatTextSelection = () => {
    setTimeout(() => processSubChatSelection(), 80);
  };

  
  const subChatSelectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice || !isOpen) return;

    const handleSelectionChange = () => {
      if (subChatSelectionTimerRef.current) {
        clearTimeout(subChatSelectionTimerRef.current);
      }
      subChatSelectionTimerRef.current = setTimeout(() => {
        processSubChatSelection();
      }, 300);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (subChatSelectionTimerRef.current) {
        clearTimeout(subChatSelectionTimerRef.current);
      }
    };
  }, [isOpen]);

  const handleCreateRecall = async (markdownContent: string | null, msgIndex?: number) => {
    try {
      if (isRecalling) return;
      setIsRecalling(true);

      let content = markdownContent;
      if (!content && msgIndex !== undefined && subMessages[msgIndex]) {
        content = subMessages[msgIndex].content;
      }

      await saveRecallCard(content || null, chatId!, sourceMessageId);
      setRecallSelection(null);
      toast.success("Recall card created successfully!");
      try {
        window.getSelection()?.removeAllRanges();
      } catch (e) {
        console.error(e);
      }
    } catch (error) {
      console.error("Failed to save recall card from subchat", error);
      toast.error("Failed to create recall card");
    } finally {
      setIsRecalling(false);
    }
  };

    return {
 
      input,
      setInput,
      subMessages,
      streamingText,
      isPinned,
      setIsPinned,
      isRecalling,
      recallSelection,
      scrollRef,
      existingSubChat,
      model,
      setModel,


      stickToChatMutation,
      streamChatMutation,


      handleSend,
      handleSubChatTextSelection,
      handleCreateRecall,
    };
}
