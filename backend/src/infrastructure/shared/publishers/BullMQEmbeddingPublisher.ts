import { IEmbeddingPublisher } from "../../../application/common/ports/IEmbeddingPublisher";
import embeddingCodeDesc from "../../queue/embeddingQueue";
import { IOutboxEvent } from "../../../infrastructure/outbox/models/MongoOutboxEventModel";

export class BullMQEmbeddingPublisher implements IEmbeddingPublisher {
  async publish(outboxId: string, content: Record<string, unknown>): Promise<void> {
    await embeddingCodeDesc({ _id: outboxId } as unknown as IOutboxEvent, content);
  }
}
