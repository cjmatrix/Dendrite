import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import toast from "react-hot-toast";

export function useResetUserRateLimits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.post(`/admin/user/${userId}/reset-usage`);
      return response.data;
    },
    onSuccess: (_, userId) => {
      toast.success("User rate limits reset successfully!", {
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
      queryClient.invalidateQueries({ queryKey: ["userUsage", userId] });
    },
    onError: (error: unknown) => {
      let errorMsg = "Failed to reset rate limits";
      if (error && typeof error === "object") {
        if ("response" in error) {
          const response = (error as { response?: { data?: { message?: string } } }).response;
          if (response?.data?.message) {
            errorMsg = response.data.message;
          }
        } else if ("message" in error) {
          errorMsg = (error as { message: string }).message;
        }
      }
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
