import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";

interface Payload{
    durationInSeconds:number
}
export function useSuspendUser(){


    const queryClient=useQueryClient();

    return useMutation({
        mutationFn: async ({ userId, payload }: { userId?: string; payload: Payload }) => {
            const response = await api.post(`/admin/user/${userId}/suspend`, payload);
            return { userId, data: response.data };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            if (data.userId) {
                queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
            }
        }
    });
}