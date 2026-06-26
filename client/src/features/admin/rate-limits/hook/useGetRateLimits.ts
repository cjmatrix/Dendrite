import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export interface RateLimitsData {
  daily_count_limits: {
    free: Record<string, number>;
    pro: Record<string, number>;
    enterprise: Record<string, number>;
    byok: Record<string, number>;
  };
  model_token_limits: Record<string, Record<string, number>>;
  default_model_token_limits: Record<string, number>;
  upload_size_limits: {
    free: { document: number; image: number };
    pro: { document: number; image: number };
    enterprise: { document: number; image: number };
    byok: { document: number; image: number };
  };
}

export function useGetRateLimits() {
  return useQuery<RateLimitsData>({
    queryKey: ["rateLimits"],
    queryFn: async () => {
      const response = await api.get("/admin/rate-limits");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
