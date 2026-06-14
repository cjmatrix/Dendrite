export interface DocumentProgressEvent {
  documentId: string;
  chatId: string;
  userId: string;
  fileName: string;
  stage: "upload" | "chunk";
  status:
    | "queued"
    | "uploading"
    | "uploaded"
    | "chunking"
    | "completed"
    | "failed";
  progress: number;
  cloudinaryUrl?: string;
  message?: string;
}

export interface IDocumentProgressPublisher {
  publish(event: DocumentProgressEvent): Promise<void>;
}
