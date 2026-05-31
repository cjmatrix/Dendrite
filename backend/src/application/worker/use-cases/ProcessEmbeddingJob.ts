import { injectable, inject } from "tsyringe";
import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import { embeddingService } from '../../../services/EmbeddingService';
import crypto from 'crypto';

@injectable()
export class ProcessEmbeddingJob {
  constructor(
    @inject("IOutboxEventRepository") private outboxRepository: IOutboxEventRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository
  ) {}

  async execute(outboxId: string, content: any) {
    try {
      const outboxEvent = await this.outboxRepository.findById(outboxId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${outboxId}`);
      }

      const [codeEmbedding, descriptionEmbedding] = await Promise.all([
        embeddingService.embed(content.code, "RETRIEVAL_DOCUMENT"),
        embeddingService.embed(content.description, "RETRIEVAL_DOCUMENT"),
      ]);

      const payload = {
        sourceId: outboxEvent.payload.sourceId.toString(),
        sourceType: outboxEvent.payload.sourceType,
        userId: outboxEvent.payload.userId.toString(),
        content: outboxEvent.payload.content,
        ...outboxEvent.payload.metadata, // e.g. language, chatId
      };

      await this.vectorRepository.upsertCodeVector(
        crypto.randomUUID(),
        codeEmbedding,
        descriptionEmbedding,
        payload
      );

      console.log(`✅ Embedded outbox ${outboxId} dims)`);

      await this.outboxRepository.updateStatus(outboxId, "processed");
    } catch (error: any) {
      await this.outboxRepository.updateStatus(outboxId, "failed", { error: error.message, incrementRetry: true });
      console.log(error.message);
      throw error; // BullMQ will retry
    }
  }
}
