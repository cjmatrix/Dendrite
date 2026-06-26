import { injectable, inject } from "tsyringe";
import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import { embeddingService } from '../../../services/EmbeddingService';
import crypto from 'crypto';
import { ILogger } from '../../common/ports/ILogger';

@injectable()
export class ProcessEmbeddingJob {
  constructor(
    @inject("IOutboxEventRepository") private outboxRepository: IOutboxEventRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("ILogger") private logger: ILogger
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      const payloadData = outboxEvent.payload as { sourceId: string, sourceType: string, userId: string, content: unknown, metadata: Record<string, unknown> };
      const payload = {
        sourceId: payloadData.sourceId.toString(),
        sourceType: payloadData.sourceType,
        userId: payloadData.userId.toString(),
        content: payloadData.content,
        ...payloadData.metadata, // e.g. language, chatId
      };

      await this.vectorRepository.upsertCodeVector(
        crypto.randomUUID(),
        codeEmbedding,
        descriptionEmbedding,
        payload
      );

      this.logger.info(`✅ Embedded outbox ${outboxId}`);

      await this.outboxRepository.updateStatus(outboxId, "processed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      await this.outboxRepository.updateStatus(outboxId, "failed", { error: error.message, incrementRetry: true });
      this.logger.error(`Failed to embed outbox event: ${outboxId}`, error);
      throw error; 
    }
  }
}
