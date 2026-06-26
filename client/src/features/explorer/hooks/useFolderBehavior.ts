import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getFolderBehavior, updateFolderBehavior } from "../api/explorerApi";
import toast from "react-hot-toast";

export function useFolderBehavior(folderId: string, onClose?: () => void) {
  const queryClient = useQueryClient();

 
  const behaviorQuery = useQuery({
    queryKey: ["behavior", folderId],
    queryFn: () => getFolderBehavior(folderId),
    enabled: !!folderId,
    staleTime: 0, 
    gcTime: 0,
  });

 
  const saveMutation = useMutation({
    mutationFn: (content: string) => updateFolderBehavior(folderId, content),
    onSuccess: () => {
      toast.success("Folder behavior updated successfully!", {
        icon: "🧠",
        style: {
          background: "#18181b",
          color: "#e4e4e7",
          border: "1px solid #3f3f46",
          borderRadius: "12px",
        },
      });
     
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["behavior", folderId] });
      
      if (onClose) {
        onClose();
      }
    },
    onError: (err: unknown) => {
      console.error(err);
      toast.error("Failed to save behavior settings.");
    },
  });

  return {
    behaviorData: behaviorQuery.data,
    isLoading: behaviorQuery.isLoading,
    isSaving: saveMutation.isPending,
    saveBehavior: saveMutation.mutate,
    error: behaviorQuery.error,
  };
}
