import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { inheritContext as apiInheritContext, unlinkInheritance as apiUnlinkInheritance } from "../api/branchApi";
import type { FileNode } from "../../explorer/types/types";

export function useInheritContext(chatId: string | undefined) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const inheritFromChat = useCallback(
    async (node: FileNode) => {
      if (node.type !== "chat" || !chatId) return;

      try {
        await apiInheritContext(chatId, node.id);
        queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
        setIsModalOpen(false);
      } catch (err) {
        console.error("Failed to link context:", err);
      }
    },
    [chatId, queryClient],
  );

  const unlinkInheritance = useCallback(async () => {
    if (!chatId) return;
    try {
      await apiUnlinkInheritance(chatId);
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    } catch (err) {
      console.error("Failed to unlink context:", err);
    }
  }, [chatId, queryClient]);

  return { isModalOpen, openModal, closeModal, inheritFromChat, unlinkInheritance };
}
