export interface QueueDocumentInput {
  documentId: string;
  tempFilePath: string;
  fileName: string;
  userId: string;
  chatId: string;
  createdAt: string;
}

export interface QueueChunkingInput {
  documentId: string;
  cloudinaryUrl: string;
  filePath: string;
  fileName: string;
  userId: string;
  chatId: string;
}

export interface IDocumentQueue {
  enqueueChunkingJob(input: QueueDocumentInput): Promise<void>;
  enqueueChunkStage(input: QueueChunkingInput): Promise<void>;
}
