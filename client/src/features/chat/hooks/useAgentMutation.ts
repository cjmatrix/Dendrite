

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendAgentMessage } from "../api/chatApi";


export const useSendAgentMessageMutation=()=>{
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["sendAgentMessage"],
        mutationFn:async({message,chatId}:{message:string,chatId:string})=>await sendAgentMessage(chatId,message),
        onMutate: async ({ message, chatId }) => {
            await queryClient.cancelQueries({ queryKey: ["chatMessages", chatId] });

            const previousMessages = queryClient.getQueryData(["chatMessages", chatId]);

            queryClient.setQueryData(["chatMessages", chatId], (old: any) => {
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

                if (!old || !old.pages || old.pages.length === 0) {
                    return {
                        pages: [{
                            messages: [optMessage],
                            nextCursor: null
                        }],
                        pageParams: [null]
                    };
                }

                const newPages = old.pages.map((page: any, idx: number) => {
                    if (idx === 0) {
                        return {
                            ...page,
                            messages: [...page.messages, optMessage]
                        };
                    }
                    return page;
                });

                return {
                    ...old,
                    pages: newPages
                };
            });

            return { previousMessages, chatId };
        },
        onError: (err, variables, context) => {
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