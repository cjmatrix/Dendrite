import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export function useUnsuspendUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.post(`/admin/user/${userId}/unsuspend`);
            return { userId, data: response.data };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
        }
    });
}
