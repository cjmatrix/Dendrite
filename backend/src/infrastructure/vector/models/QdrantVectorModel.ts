

export interface QdrantCodeBlockPayload {
  userId: string;
  chatId: string;
  content: {
    code: string;
    description: string;
  };
  language: string;
}



export interface QdrantChatSummaryPayload {
  userId: string;
  chatId: string;
  content: {
    fact: string;
  };
}



export interface QdrantDocumentPayload {
  userId: string;
  chatId: string;
  sourceType: "document";
  fileName: string;
  fileUrl: string;
  content: {
    text: string;
    chunkIndex: number;
    totalChunks: number;
    headings: string[];
    kinds: string[];
  };
}



export interface QdrantSearchCachePayload {
  query: string;
  result: string;
  createdAt: number; 
}
