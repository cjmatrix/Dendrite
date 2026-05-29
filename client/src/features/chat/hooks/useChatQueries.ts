import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { chatRepository } from "../core/container";

/**
 * Hook: Fetch chat metadata (title, context parents, etc.)
 */
export function useChatDetails(chatId: string | undefined) {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => chatRepository.getChat(chatId!),
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook: Infinite scroll chat messages with cursor pagination
 */
export function useChatMessages(chatId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["chatMessages", chatId],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam = null }) =>
      chatRepository.getMessages(chatId!, pageParam, 10),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5,
  });
}
