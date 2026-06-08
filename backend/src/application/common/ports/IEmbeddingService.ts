export type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "CODE_RETRIEVAL_QUERY"
  | "QUESTION_ANSWERING"
  | "FACT_VERIFICATION"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING";

export interface IEmbeddingService {
  embed(text: string, taskType?: EmbeddingTaskType): Promise<number[]>;
  embedBatch(texts: string[], taskType?: EmbeddingTaskType): Promise<number[][]>;
  healthCheck(): Promise<boolean>;
}
