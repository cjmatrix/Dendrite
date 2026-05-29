import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { getChat, getMessages } from "../api/chatApi";




export function useChatDetails(chatId: string | undefined) {
  return useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => getChat(chatId!),
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5,
  });
}



export function useChatMessages(chatId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["chatMessages", chatId],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam = null }) =>
      getMessages(chatId!, pageParam, 10),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!chatId,
    staleTime: 1000 * 60 * 5,
  });
}
