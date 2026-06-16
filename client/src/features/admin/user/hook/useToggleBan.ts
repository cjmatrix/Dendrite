import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export function useToggleBan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.post(`/admin/user/${userId}/toggle-ban`);
            return { userId, status: response.data.data.status };
        },
        onMutate: async (userId: string) => {
           
            await queryClient.cancelQueries({ queryKey: ["user", userId] });

            const previousUser = queryClient.getQueryData(["user", userId]);
            

            queryClient.setQueryData(["user", userId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    status: old.status === "banned" ? "active" : "banned",
                };
            });

            

            return { previousUser,};
        },
        onError: (err, userId, context: any) => {
            if (context?.previousUser) {
                queryClient.setQueryData(["user", userId], context.previousUser);
            }
    
        },
        onSettled: (data, error, userId) => {
            // queryClient.invalidateQueries({ queryKey: ["users"] });
            // queryClient.invalidateQueries({ queryKey: ["user", userId] });
        },
    });
}
