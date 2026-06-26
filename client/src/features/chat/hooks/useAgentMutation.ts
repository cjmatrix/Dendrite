

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendAgentMessage } from "../api/chatApi";


export const useSendAgentMessageMutation=()=>{
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["sendAgentMessage"],
        mutationFn:async({message,chatId}:{message:string,chatId:string|undefined})=>await sendAgentMessage(chatId,message),
        onMutate: async ({ message, chatId }) => {
            await queryClient.cancelQueries({ queryKey: ["chatMessages", chatId] });

            const previousMessages = queryClient.getQueryData(["chatMessages", chatId]);

            queryClient.setQueryData(["chatMessages", chatId], (old: unknown) => {
                const optMessage = {
                    _id: `opt-${Date.now()}-user`,
                    id: `opt-${Date.now()}-user`,
                    chatId,
                    role: "user" as const,
                    content: message,
                    createdAt: new Date().toISOString(),
                    hasSubChat: false,
                    subChats: []
                };

                const oldData = old as {
                    pages: {
                        messages: unknown[];
                        nextCursor: string | null;
                    }[];
                    pageParams: unknown[];
                } | undefined;

                if (!oldData || !oldData.pages || oldData.pages.length === 0) {
                    return {
                        pages: [{
                            messages: [optMessage],
                            nextCursor: null
                        }],
                        pageParams: [null]
                    };
                }

                const newPages = oldData.pages.map((page, idx: number) => {
                    if (idx === 0) {
                        return {
                            ...page,
                            messages: [...page.messages, optMessage]
                        };
                    }
                    return page;
                });

                return {
                    ...oldData,
                    pages: newPages
                };
            });

            return { previousMessages, chatId };
        },
        onError: (_, __, context: { previousMessages: unknown; chatId: string | undefined } | undefined) => {
            if (context) {
                queryClient.setQueryData(["chatMessages", context.chatId], context.previousMessages);
            }
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["chatMessages", variables.chatId] });
            if(data.type==="success"){
                queryClient.invalidateQueries({queryKey:["folders"]})
                 queryClient.invalidateQueries({queryKey:["chats"]})
            }
        }
    })

}