import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { branchRepository } from "../core/container";
import type { FileNode } from "../types/types";

export function useInheritContext(chatId: string | undefined) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const inheritFromChat = useCallback(
    async (node: FileNode) => {
      if (node.type !== "chat" || !chatId) return;

      try {
        await branchRepository.inheritContext(chatId, node.id);
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
      await branchRepository.unlinkInheritance(chatId);
      queryClient.invalidateQueries({ queryKey: ["chat", chatId] });
    } catch (err) {
      console.error("Failed to unlink context:", err);
    }
  }, [chatId, queryClient]);

  return { isModalOpen, openModal, closeModal, inheritFromChat, unlinkInheritance };
}
