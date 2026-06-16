import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateByokKeys, getByokKeys } from "../api/byokApi";
import type { UpdateByokKeysParams } from "../api/byokApi";

export function useUpdateByokKeys() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider, keys }: UpdateByokKeysParams) => updateByokKeys({ provider, keys }),
    onSuccess: () => {
      
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["byok-keys"] });
    },
  });
}

export function useGetByokKeys(provider: string = "gemini", enabled: boolean = false) {
  return useQuery({
    queryKey: ["byok-keys", provider],
    queryFn: () => getByokKeys(provider),
    enabled,
  });
}
