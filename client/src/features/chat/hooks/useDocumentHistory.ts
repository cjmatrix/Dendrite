import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../../lib/axios";
import { useAppSelector } from "../../../store/store";

export interface UploadedDocument {
  _id:string
  fileType: "image" | "document";
  filename: string;
  extension: string;
  fileUrl: string;
  uploadedAt: Date;
}


export function useDocumentHistory(chatId?: string) {
  const {isShareMode } = useAppSelector((state) => state.explorer);
  const [isShowingBrowser, setIsShowingBrowser] = useState(false);

  const { data: documents = [], isLoading, refetch } = useQuery<UploadedDocument[]>({
    queryKey: ["documents", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const response = await api.get(`/chats/${chatId}/documents`);
      return response.data.data.documents || [];
    },
    enabled: !!chatId&&!isShareMode,
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
     
      await api.delete(`/chats/${chatId}/documents`, { data: { fileUrl } });
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
