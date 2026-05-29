import { useState, useRef, useCallback, useEffect } from "react";
import {
  classifyFile,
  type DocumentProgressEvent,
} from "../types/FileUpload";
import { uploadImage, uploadFile, streamDocumentProgress } from "../api/chatApi";

type AttachedFile = { name: string; url: string };

type DocumentUploadState = {
  documentId: string;
  fileName: string;
  stage: "upload" | "chunk";
  status: "queued" | "uploading" | "uploaded" | "chunking" | "completed" | "failed";
  progress: number;
  message?: string;
  fileUrl?: string;
};

export function useFileUpload(chatId?: string) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<AttachedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [documentUpload, setDocumentUpload] = useState<DocumentUploadState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const activeDocumentIdRef = useRef<string | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const applyProgressUpdate = useCallback(
    (event: DocumentProgressEvent, shouldBroadcast: boolean) => {
      if (chatId && event.chatId !== chatId) return;
      if (
        activeDocumentIdRef.current &&
        event.documentId !== activeDocumentIdRef.current
      ) {
        return;
      }

      activeDocumentIdRef.current = event.documentId;

      setDocumentUpload({
        documentId: event.documentId,
        fileName: event.fileName,
        stage: event.stage,
        status: event.status,
        progress: event.progress,
        message: event.message,
        fileUrl: event.cloudinaryUrl,
      });

      if (event.status === "completed" && event.cloudinaryUrl) {
        setSelectedFile({ name: event.fileName, url: event.cloudinaryUrl });
        setSelectedImageUrl(null);
        setIsUploading(false);
        if (streamCleanupRef.current) {
          streamCleanupRef.current();
          streamCleanupRef.current = null;
        }
      } else if (event.status === "failed") {
        setIsUploading(false);
        if (streamCleanupRef.current) {
          streamCleanupRef.current();
          streamCleanupRef.current = null;
        }
      } else {
        setIsUploading(true);
      }

      if (shouldBroadcast && broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: "document-progress",
          chatId: event.chatId,
          event,
        });
      }
    },
    [chatId],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
      return;
    }

    const channel = new BroadcastChannel("dendrites-document-progress");
    broadcastChannelRef.current = channel;

    const onMessage = (message: MessageEvent) => {
      const payload = message.data;
      if (!payload || payload.type !== "document-progress") return;
      applyProgressUpdate(payload.event as DocumentProgressEvent, false);
    };

    channel.addEventListener("message", onMessage);

    return () => {
      channel.removeEventListener("message", onMessage);
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [applyProgressUpdate]);

  useEffect(() => {
    return () => {
      if (streamCleanupRef.current) {
        streamCleanupRef.current();
        streamCleanupRef.current = null;
      }
    };
  }, []);

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return;

    const classification = classifyFile(file);

    if (classification === "unsupported") {
      alert("Please choose a valid image or supported document/code file.");
      return;
    }

    setIsUploading(true);
    try {
      if (classification === "image") {
        const result = await uploadImage(file, chatId);
        setSelectedImageUrl(result.url);
        setSelectedFile(null);
        setDocumentUpload(null);
        setIsUploading(false);
      } else {
        const result = await uploadFile(file, chatId, file.name);
        activeDocumentIdRef.current = result.documentId;
        setDocumentUpload({
          documentId: result.documentId,
          fileName: result.fileName,
          stage: "upload",
          status: result.status,
          progress: 0,
          message: "Document queued for processing",
        });
        setSelectedImageUrl(null);

        if (!chatId) {
          throw new Error("Chat ID is required for document uploads");
        }

        if (streamCleanupRef.current) {
          streamCleanupRef.current();
          streamCleanupRef.current = null;
        }

        streamCleanupRef.current = streamDocumentProgress(
          chatId,
          result.documentId,
          (event) => applyProgressUpdate(event, true),
          () => {
            setIsUploading(false);
            setDocumentUpload((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                status: "failed",
                message: "Lost real-time progress connection",
              };
            });
          },
        );
      }
    } catch (error) {
      console.error("File upload failed", error);
      alert("File upload failed. Please try again.");
      setDocumentUpload(null);
    } finally {
      if (classification === "image") {
        setIsUploading(false);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [chatId, applyProgressUpdate]);

  const clearImage = useCallback(() => setSelectedImageUrl(null), []);
  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const isDocumentProcessing = !!documentUpload && documentUpload.status !== "completed";
  const canOpenSplitView = !!selectedFile && !isDocumentProcessing;

  return {
    selectedImageUrl,
    selectedFile,
    isUploading,
    documentUpload,
    isDocumentProcessing,
    canOpenSplitView,
    fileInputRef,
    handleFileSelect,
    clearImage,
    clearFile,
  };
}
