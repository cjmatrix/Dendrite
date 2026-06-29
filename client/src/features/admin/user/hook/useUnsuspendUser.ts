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
           

            queryClient.setQueryData(["user", userId], (old: unknown) => {
                const oldUser = old as { status?: string; [key: string]: unknown } | undefined;
                if (!oldUser) return oldUser;
                return {
                    ...oldUser,
                    status: "active",
                };
            });

            return { previousUser };
        },
        onError: (_err: unknown, userId: string, context: unknown) => {
            const ctx = context as { previousUser?: unknown } | undefined;
            if (ctx?.previousUser) {
                queryClient.setQueryData(["user", userId], ctx.previousUser);
            }
           
        },
        onSettled: (_,__, _userId) => {
            // queryClient.invalidateQueries({ queryKey: ["users"] });
            // queryClient.invalidateQueries({ queryKey: ["user", userId] });
        },
    });
}
