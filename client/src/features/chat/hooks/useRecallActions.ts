import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { saveRecallCard as apiSaveRecallCard } from "../api/recallApi";

import toast from "react-hot-toast";

interface PendingRecall {
  markdownContent: string | null;
  msgId: string;
}

export function useRecallActions(chatId: string | undefined) {
  const [isRecalling, setIsRecalling] = useState(false);
  const [isDeckPickerOpen, setIsDeckPickerOpen] = useState(false);
  const [pendingRecall, setPendingRecall] = useState<PendingRecall | null>(null);
  const queryClient = useQueryClient();

  const initiateRecall = useCallback(
    (markdownContent: string | null, msgId: string) => {
      if (isRecalling || !chatId) return;
      setPendingRecall({ markdownContent, msgId });
      setIsDeckPickerOpen(true);
    },
    [chatId, isRecalling],
  );

  const confirmRecall = useCallback(
    async (deckId: string | null) => {
      if (isRecalling || !chatId || !pendingRecall) return;
      setIsRecalling(true);
      setIsDeckPickerOpen(false);

      try {
        await apiSaveRecallCard(pendingRecall.markdownContent, chatId, pendingRecall.msgId, deckId);
        queryClient.invalidateQueries({ queryKey: ["recallCount"] });
        queryClient.invalidateQueries({ queryKey: ["dueCards"] });
        toast.success("Recall card created successfully!");
      } catch (error) {
        console.error("Failed to save recall card", error);
        toast.error("Failed to create recall card");
      } finally {
        setIsRecalling(false);
        setPendingRecall(null);
      }
    },
    [chatId, isRecalling, queryClient, pendingRecall],
  );

  const cancelRecall = useCallback(() => {
    setIsDeckPickerOpen(false);
    setPendingRecall(null);
  }, []);

  return {
    isRecalling,
    isDeckPickerOpen,
    initiateRecall,
    confirmRecall,
    cancelRecall,
  };
}
