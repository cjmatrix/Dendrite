import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export function useUnsuspendUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.post(`/admin/user/${userId}/unsuspend`);
            return { userId, data: response.data };
        },
        onMutate: async (userId: string) => {
         
            await queryClient.cancelQueries({ queryKey: ["user", userId] });

            const previousUser = queryClient.getQueryData(["user", userId]);
           

            queryClient.setQueryData(["user", userId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    status: "active",
                };
            });

            return { previousUser };
        },
        onError: (_, userId, context: any) => {
            if (context?.previousUser) {
                queryClient.setQueryData(["user", userId], context.previousUser);
            }
           
        },
        onSettled: (_,__, userId) => {
            // queryClient.invalidateQueries({ queryKey: ["users"] });
            // queryClient.invalidateQueries({ queryKey: ["user", userId] });
        },
    });
}
