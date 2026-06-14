export type ChatDocumentType = "image" | "document";

export interface ChatDocument {
  _id:string;
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
  contextParent: { _id: string; title: string | null } | null;
  summary: string | null;
  tokenCount: number;
  unsummarizedCount: number;
  documents: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
