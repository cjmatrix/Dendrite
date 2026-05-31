export type ChatDocumentType = "image" | "document";

export interface ChatDocument {
  fileType: ChatDocumentType;
  filename: string;
  extension: string;
  fileUrl: string;
  uploadedAt?: Date | string;
}

export interface IChat {
  _id: string;
  userId: string;
  folderId: string | null;
  title: string;
  contextParent: string | null;
  summary: string | null;
  tokenCount: number;
  unsummarizedCount: number;
  documents: ChatDocument[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
