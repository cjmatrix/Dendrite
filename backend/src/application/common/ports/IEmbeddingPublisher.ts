export interface IEmbeddingPublisher {
  publish(outboxId: string, content: Record<string, unknown>): Promise<void>;
}
