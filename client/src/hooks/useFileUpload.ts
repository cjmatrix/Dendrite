import { useState, useRef, useCallback } from "react";
import { classifyFile } from "../core/domain/entities/FileUpload";
import { chatRepository } from "../core/container";

export function useFileUpload() {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; url: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File | null) => {
    if (!file) return;

    const classification = classifyFile(file);

    if (classification === "unsupported") {
      alert("Please choose a valid image or supported document/code file.");
      return;
    }

    setIsUploading(true);
    try {
      const result =
        classification === "image"
          ? await chatRepository.uploadImage(file)
          : await chatRepository.uploadFile(file);

      if (classification === "image") {
        setSelectedImageUrl(result.url);
        setSelectedFile(null);
      } else {
        setSelectedFile({ name: file.name, url: result.url });
        setSelectedImageUrl(null);
      }
    } catch (error) {
      console.error("File upload failed", error);
      alert("File upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, []);

  const clearImage = useCallback(() => setSelectedImageUrl(null), []);
  const clearFile = useCallback(() => setSelectedFile(null), []);

  return {
    selectedImageUrl,
    selectedFile,
    isUploading,
    fileInputRef,
    handleFileSelect,
    clearImage,
    clearFile,
  };
}
