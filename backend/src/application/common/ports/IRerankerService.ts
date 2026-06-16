export interface RerankResult<T> {
  score: number;
  document: T;
  metadata?: any;
}

export interface IRerankerService {
  rerank<T>(
    query: string,
    documents: { text: string; item: T }[],
    model?: string
  ): Promise<RerankResult<T>[]>;
}
