import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export function useToggleBan() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (userId: string) => {
            const response = await api.post(`/admin/user/${userId}/toggle-ban`);
            return { userId, status: response.data.data.status };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            queryClient.invalidateQueries({ queryKey: ["user", data.userId] });
        }
    });
}
