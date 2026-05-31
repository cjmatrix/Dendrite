export interface IEmbeddingPublisher {
  publish(outboxId: string, content: any): Promise<void>;
}
