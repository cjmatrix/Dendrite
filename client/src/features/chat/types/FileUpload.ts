export interface ImageUploadResult {
  type: "image";
  url: string;
}

export interface DocumentUploadResult {
  type: "document";
  documentId: string;
  fileName: string;
  status: "queued" | "uploading" | "uploaded" | "chunking" | "completed" | "failed";
}

export type UploadResult = ImageUploadResult | DocumentUploadResult;

export interface DocumentProgressEvent {
  documentId: string;
  chatId: string;
  userId: string;
  fileName: string;
  stage: "upload" | "chunk";
  status: "queued" | "uploading" | "uploaded" | "chunking" | "completed" | "failed";
  progress: number;
  cloudinaryUrl?: string;
  message?: string;
  timestamp: string;
}


export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/xml",
  "text/xml",
  "application/yaml",
  "text/yaml",
  "application/x-yaml",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/rtf",
  "application/octet-stream",
]);


export const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  ".pdf", ".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".rtf",
  ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".c", ".cpp",
  ".h", ".hpp", ".go", ".rs", ".php", ".rb", ".sh", ".sql",
  ".html", ".css",
]);


export function classifyFile(file: File): "image" | "document" | "unsupported" {
  if (file.type.startsWith("image/")) return "image";

  const ext = file.name.includes(".")
    ? `.${file.name.split(".").pop()?.toLowerCase()}`
    : "";

  if (ALLOWED_DOCUMENT_MIME_TYPES.has(file.type) || ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    return "document";
  }

  return "unsupported";
}
