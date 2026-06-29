import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllFeedback, updateFeedbackStatus } from "../api/adminFeedbackApi";
import toast from "react-hot-toast";

export const useAdminFeedback = () => {
  return useQuery({
    queryKey: ["adminFeedback"],
    queryFn: getAllFeedback,
  });
};

export const useUpdateFeedbackStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'new' | 'reviewed' | 'resolved' }) =>
      updateFeedbackStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminFeedback"] });
      toast.success("Feedback status updated");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update status");
    },
  });
};
