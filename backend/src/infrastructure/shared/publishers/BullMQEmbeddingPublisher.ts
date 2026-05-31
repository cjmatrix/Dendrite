import { IEmbeddingPublisher } from "../../../application/common/ports/IEmbeddingPublisher";
import embeddingCodeDesc from "../../../queue/embeddingQueue";

export class BullMQEmbeddingPublisher implements IEmbeddingPublisher {
  async publish(outboxId: string, content: any): Promise<void> {
    await embeddingCodeDesc({ _id: outboxId } as any, content);
  }
}
