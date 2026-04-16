export interface IVectorRepository {
  searchSimilarCode(
    codeQueryVector: number[],
    descQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK?: number,
  ): Promise<any[]>;

  searchSimilarChatChunk(
    chunkQueryVector: number[],
    userId: string,
    chatIds: string[],
    topK?: number
  ): Promise<any[]>;

  deleteVectorsByChatIds(userId: string, chatIds: string[]): Promise<void>;

  upsertCodeVector(
    id: string,
    codeVector: number[],
    descriptionVector: number[],
    payload: any
  ): Promise<void>;

  upsertSummaryVectors(points: any[]): Promise<void>;

  upsertDocumentVectors(points: any[]): Promise<void>;

  searchSemanticCache(queryVector: number[], minTimestamp: number): Promise<any[]>;

  upsertSearchCache(id: string, queryVector: number[], payload: any): Promise<void>;

  deleteOldSearchCache(minTimestamp: number): Promise<void>;

  searchDocuments(
    queryText:string,
    queryVector: number[],
    userId: string,
    chatIds: string[],
    topK?: number
  ): Promise<any[]>;
}
