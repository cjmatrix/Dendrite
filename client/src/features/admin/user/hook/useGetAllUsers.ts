import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";


export interface UserFilters {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export function useGetAllUsers(page: number = 1, limit: number = 10, filters?: UserFilters) {
    return useQuery({
        queryKey: ["users", page, limit, filters],
        queryFn: async () => {
            const response = await api.get("/admin/user", {
                params: {
                    page,
                    limit,
                    ...filters
                }
            });
            return response.data.data;
        },
        staleTime: 0,
    });
}