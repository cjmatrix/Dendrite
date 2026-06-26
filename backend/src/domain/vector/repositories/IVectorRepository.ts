export interface IVectorSearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
  content?: Record<string, unknown>;
  fact?: Record<string, unknown>;
  document?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  language?: string;
}

export interface IVectorPoint {
  id: string;
  vector?: number[];
  vectors?: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export interface IVectorRepository {
  searchSimilarCode(
    codeQueryVector: number[],
    descQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK?: number,
  ): Promise<IVectorSearchResult[]>;

  searchSimilarChatChunk(
    chunkQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK?: number
  ): Promise<IVectorSearchResult[]>;

  deleteVectorsByChatIds(userId: string, chatIds: string[]): Promise<void>;

  deleteDocumentVectorsByFileUrl(userId: string | null, fileUrl: string): Promise<void>;

  deleteDocumentVectorsByContentHash(contentHash: string): Promise<void>;

  upsertCodeVector(
    id: string,
    codeVector: number[],
    descriptionVector: number[],
    payload: Record<string, unknown>
  ): Promise<void>;

  upsertSummaryVectors(points: IVectorPoint[]): Promise<void>;

  upsertDocumentVectors(points: IVectorPoint[]): Promise<void>;

  searchSemanticCache(queryVector: number[], minTimestamp: number): Promise<IVectorSearchResult[]>;

  upsertSearchCache(id: string, queryVector: number[], payload: Record<string, unknown>): Promise<void>;

  deleteOldSearchCache(minTimestamp: number): Promise<void>;

  searchDocuments(
    queryText: string,
    queryVector: number[],
    contentHashes: string[],
    topK?: number
  ): Promise<IVectorSearchResult[]>;
}
