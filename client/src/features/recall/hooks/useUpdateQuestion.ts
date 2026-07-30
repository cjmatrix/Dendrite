import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecallQuestion } from "../../chat/api/recallApi";
import toast from "react-hot-toast";

export interface UpdateQuestionParams {
  cardId: string;
  question: string;
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, question }: UpdateQuestionParams) => {
      return updateRecallQuestion(cardId, question);
    },
    onSuccess: () => {
      toast.success("Recall question updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["dueCards"] });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const msg = error?.response?.data?.message || "Failed to update recall question";
      toast.error(msg);
    },
  });
}
