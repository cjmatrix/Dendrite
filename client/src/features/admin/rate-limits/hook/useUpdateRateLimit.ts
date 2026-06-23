import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

interface UpdateRateLimitPayload {
  key: string; // "daily_count_limits" | "model_token_limits" | "default_model_token_limits"
  value: any;
}

export function useUpdateRateLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: UpdateRateLimitPayload) => {
      const response = await api.put(`/admin/rate-limits/${key}`, { value });
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success(`Rate limit '${variables.key.replace(/_/g, " ")}' updated successfully!`, {
        style: {
          background: "#18181b",
          color: "#e4e4e7",
          border: "1px solid #3f3f46",
          borderRadius: "16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
        },
      });
      queryClient.invalidateQueries({ queryKey: ["rateLimits"] });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || error.message || "Failed to update rate limits";
      toast.error(errorMsg, {
        style: {
          background: "#18181b",
          color: "#e4e4e7",
          border: "1px solid #3f3f46",
          borderRadius: "16px",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.4)",
        },
      });
    }
  });
}
