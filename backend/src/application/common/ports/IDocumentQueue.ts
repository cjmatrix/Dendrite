export interface QueueDocumentInput {
  documentId: string;
  tempFilePath: string;
  fileName: string;
  userId: string;
  chatId: string;
  createdAt: string;
}

export interface IDocumentQueue {
  enqueueChunkingJob(input: QueueDocumentInput): Promise<void>;
}
