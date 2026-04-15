import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import generateCompressedChat from '../../../utils/AISummary';
import { embeddingService } from '../../../services/EmbeddingService';
import crypto from 'crypto';

export class ProcessSummaryJob {
  constructor(
    private outboxRepository: IOutboxEventRepository,
    private vectorRepository: IVectorRepository
  ) {}

  async execute(summaryOutboxEventId: string, messageToCompress: any[]) {
    try {
      const outboxEvent = await this.outboxRepository.findById(summaryOutboxEventId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${summaryOutboxEventId}`);
      }

      // Long Term Archive
      const rawCompressedNodes = await generateCompressedChat(messageToCompress);

      const points = [];
      const contextChunks = rawCompressedNodes
        .split("|")
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0);

      for (const chunk of contextChunks) {
        const embedding = await embeddingService.embed(chunk, "RETRIEVAL_DOCUMENT");

        points.push({
          id: crypto.randomUUID(),
          vector: embedding,
          payload: {
            sourceId: outboxEvent.payload.sourceId.toString(),
            sourceType: outboxEvent.payload.sourceType, 
            userId: outboxEvent.payload.userId.toString(),
            content: { fact: chunk },
            ...outboxEvent.payload.metadata, 
          },
        });
      }

      if (points.length > 0) {
        await this.vectorRepository.upsertSummaryVectors(points);
      }

      console.log(`✅ Embedded ${points.length} chunks for summary outbox ${summaryOutboxEventId}`);

      await this.outboxRepository.updateStatus(summaryOutboxEventId, "processed");
    } catch (error: any) {
      await this.outboxRepository.updateStatus(summaryOutboxEventId, "failed", { error: error.message, incrementRetry: true });
      console.log(error.message);
      throw error;
    }
  }
}
