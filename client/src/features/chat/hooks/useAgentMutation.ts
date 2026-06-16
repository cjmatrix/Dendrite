

import { useMutation } from "@tanstack/react-query";
import { sendAgentMessage } from "../api/chatApi";


export const useSendAgentMessageMutation=()=>{


    return useMutation({
        mutationFn:({message,chatId}:{message:string,chatId:string})=>sendAgentMessage(chatId,message)
    })

}