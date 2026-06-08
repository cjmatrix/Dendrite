import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateByokKeys } from "../api/byokApi";
import type { UpdateByokKeysParams } from "../api/byokApi";

export function useUpdateByokKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, keys }: UpdateByokKeysParams) => updateByokKeys({ provider, keys }),
    onSuccess: () => {
      // Invalidate user queries in the query cache if any exist
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
