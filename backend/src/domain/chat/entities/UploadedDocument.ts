export interface IUploadedDocument {
  _id: string;
  chatId: string;
  userId: string;
  fileType: "image" | "document";
  filename: string;
  extension: string;
  fileUrl: string;
  contentHash: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
