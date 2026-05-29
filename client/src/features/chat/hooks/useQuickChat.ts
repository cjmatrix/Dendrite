import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubChat, stickToChat, streamQuickChat } from "../api/quickChatApi";
import { saveRecallCard } from "../api/recallApi";
import { getMarkdownFromDOMSelection } from "../../../utils/markdownUtils";
import { requestFirebaseNotificationPermission } from "../../../lib/firebase";

interface UseQuickChatParams {
  chatId: string | undefined;
  sourceMessageId: string;
  selectedText: string;
  subChatId?: string;
  relativeY?: number;
  isOpen: boolean;
}

export function useQuickChat({
  chatId,
  sourceMessageId,
  selectedText,
  subChatId,
  relativeY,
  isOpen,
}: UseQuickChatParams) {
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");
  const [subMessages, setSubMessages] = useState<any[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isRecalling, setIsRecalling] = useState(false);
  const [recallSelection, setRecallSelection] = useState<{
    markdown: string;
    x: number;
    y: number;
    msgIndex: number;
    visible: boolean;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);




  // ── Fetch existing subchat ───────────────────────
  const { data: existingSubChat, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["subchat", chatId, sourceMessageId, subChatId],
    queryFn: () => getSubChat(chatId!, subChatId!),
    enabled: !!chatId && !!sourceMessageId && isOpen && !!subChatId,
  });








  // Sync fetched history into local state
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

  
  // useEffect(() => {
  //   if (scrollRef.current) {
  //     scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  //   }
  // }, [subMessages, streamingText]);






  // Stick to chat mutation ────────────────────────────────
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
    },
  });



  // Stream quick chat mutation ───────────────────
  const streamChatMutation = useMutation({
    mutationFn: async ({ userPrompt }: { userPrompt: string }) => {
      return streamQuickChat({
        chatId: chatId!,
        anchorMessageId: sourceMessageId,
        highlightedText: selectedText,
        quickChatHistory: subMessages.concat({ role: "user", content: userPrompt }),
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

  // Handlers ─────────────────────────────────────


  const handleSend = () => {
    if (!input.trim() || streamChatMutation.isPending) return;
    const userPrompt = input.trim();
    setInput("");
    streamChatMutation.mutate({ userPrompt });
  };

  const handleSubChatTextSelection = () => {
    const sel = window.getSelection();
    const selectedStr = sel?.toString().trim();

    if (selectedStr && selectedStr.length > 0) {
      const range = sel?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      let insideModal = false;
      let curr: any = sel?.anchorNode;
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

      if (rect && insideModal && msgIndex >= 0) {
        const capturedMarkdown = getMarkdownFromDOMSelection() || selectedStr;
        setRecallSelection({
          markdown: capturedMarkdown,
          x: rect.left + rect.width / 2,
          y: rect.top + window.scrollY,
          msgIndex,
          visible: true,
        });
      }
    } else {
      setTimeout(() => setRecallSelection((prev) => (prev ? { ...prev, visible: false } : null)), 200);
    }
  };

  const handleCreateRecall = async (markdownContent: string | null, msgIndex?: number) => {
    try {
      if (isRecalling) return;
      setIsRecalling(true);
      await requestFirebaseNotificationPermission();

      let content = markdownContent;
      if (!content && msgIndex !== undefined && subMessages[msgIndex]) {
        content = subMessages[msgIndex].content;
      }

      await saveRecallCard(content || null, chatId!, sourceMessageId);
      setRecallSelection(null);
    } catch (error) {
      console.error("Failed to save recall card from subchat", error);
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


    stickToChatMutation,
    streamChatMutation,


    handleSend,
    handleSubChatTextSelection,
    handleCreateRecall,
  };
}
