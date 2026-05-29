import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { saveRecallCard as apiSaveRecallCard } from "../api/recallApi";
import { requestFirebaseNotificationPermission } from "../../../lib/firebase";

export function useRecallActions(chatId: string | undefined) {
  const [isRecalling, setIsRecalling] = useState(false);
  const queryClient = useQueryClient();

  const saveRecallCard = useCallback(
    async (markdownContent: string | null, msgId: string) => {
      if (isRecalling || !chatId) return;
      setIsRecalling(true);

      try {
        await requestFirebaseNotificationPermission();
        await apiSaveRecallCard(markdownContent, chatId, msgId);
        queryClient.invalidateQueries({ queryKey: ["recallCount"] });
      } catch (error) {
        console.error("Failed to save recall card", error);
      } finally {
        setIsRecalling(false);
      }
    },
    [chatId, isRecalling, queryClient],
  );

  return { isRecalling, saveRecallCard };
}
