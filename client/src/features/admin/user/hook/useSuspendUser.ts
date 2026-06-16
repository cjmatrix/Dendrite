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
        onMutate: async ({ userId }) => {
            if (!userId) return;

            await queryClient.cancelQueries({ queryKey: ["users"] });
            await queryClient.cancelQueries({ queryKey: ["user", userId] });

            const previousUser = queryClient.getQueryData(["user", userId]);
            const previousQueries = queryClient.getQueriesData({ queryKey: ["users"] });

            queryClient.setQueryData(["user", userId], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    status: "suspended",
                };
            });

            queryClient.setQueriesData({ queryKey: ["users"] }, (old: any) => {
                if (!old || !old.users) return old;
                return {
                    ...old,
                    users: old.users.map((u: any) => {
                        if (u._id === userId) {
                            return {
                                ...u,
                                status: "suspended",
                            };
                        }
                        return u;
                    }),
                };
            });

            return { previousUser, previousQueries };
        },
        onError: (err, { userId }, context: any) => {
            if (!userId) return;
            if (context?.previousUser) {
                queryClient.setQueryData(["user", userId], context.previousUser);
            }
            if (context?.previousQueries) {
                context.previousQueries.forEach(([queryKey, value]: any) => {
                    queryClient.setQueryData(queryKey, value);
                });
            }
        },
        onSettled: (data, error, { userId }) => {
            if (userId) {
                queryClient.invalidateQueries({ queryKey: ["users"] });
                queryClient.invalidateQueries({ queryKey: ["user", userId] });
            }
        },
    });
}