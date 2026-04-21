import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

export interface UploadedDocument {
  fileType: "image" | "document";
  filename: string;
  extension: string;
  fileUrl: string;
  uploadedAt: Date;
}

export function useDocumentHistory(chatId?: string) {
  const [isShowingBrowser, setIsShowingBrowser] = useState(false);

  const { data: documents = [], isLoading, refetch } = useQuery<UploadedDocument[]>({
    queryKey: ["documents", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const response = await api.get(`/chats/${chatId}/documents`);
      return response.data.data.documents || [];
    },
    enabled: !!chatId,
  });

  const addDocument = useCallback(
    async (
      _fileType: "image" | "document",
      _filename: string,
      _fileUrl: string,
      _mimeType: string
    ) => {
   
      refetch();
    },
    [refetch]
  );

  const removeDocument = useCallback(async (fileUrl: string) => {
    try {
      // Call the delete API
      await api.delete(`/chats/${chatId}/documents`, { data: { fileUrl } });
      // Refetch to update the list
      refetch();
    } catch (error) {
      console.error('Failed to remove document:', error);
      throw error;
    }
  }, [refetch, chatId]);



  return {
    documents,
    isShowingBrowser,
    setIsShowingBrowser,
    addDocument,
    removeDocument,
    isLoading,
  };
}
