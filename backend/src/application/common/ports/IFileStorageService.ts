export interface FileStorageResult {
  url: string;
}

export interface IFileStorageService {
  uploadDocument(filePath: string): Promise<FileStorageResult>;
  uploadImage(buffer: Buffer, mimetype: string): Promise<FileStorageResult>;
}
