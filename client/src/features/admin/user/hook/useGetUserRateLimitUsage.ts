import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export interface UserRateLimitUsage {
  tier: string;
  counts: Record<string, { current: number; limit: number }>;
  tokens: Record<string, { current: number; limit: number }>;
  resetsInSeconds: number;
}

export function useGetUserRateLimitUsage(userId: string) {
  return useQuery<UserRateLimitUsage>({
    queryKey: ["userUsage", userId],
    queryFn: async () => {
      const response = await api.get(`/admin/user/${userId}/usage`);
      return response.data.data;
    },
    enabled: !!userId,
  });
}
