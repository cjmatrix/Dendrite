import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import generateCompressedChat from '../../../utils/AISummary';
import { embeddingService } from '../../../services/EmbeddingService';
import crypto from 'crypto';

interface MessageToCompress {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class ProcessSummaryJob {
  constructor(
    private outboxRepository: IOutboxEventRepository,
    private vectorRepository: IVectorRepository
  ) {}

  async execute(
    summaryOutboxEventId: string,
    messageToCompress: MessageToCompress[]
  ) {
    try {
      const outboxEvent = await this.outboxRepository.findById(
        summaryOutboxEventId
      );
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${summaryOutboxEventId}`);
      }

      const rawCompressedNodes = await generateCompressedChat(messageToCompress);

    
      const contextChunks = rawCompressedNodes
        .split(/\s*\|\|\|\s*/)
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 20); 

     
      if (contextChunks.length === 0) {
        console.warn(
          `🛑 No valid chunks for outbox ${summaryOutboxEventId}   marking processed`
        );
        await this.outboxRepository.updateStatus(
          summaryOutboxEventId,
          "processed"
        );
        return;
      }

    
      if (contextChunks.length > 50) {
        console.warn(
          `🛑 High chunk count (${contextChunks.length})   truncating to 50`
        );
        contextChunks.splice(50);
      }

      
      const embeddings = await Promise.all(
        contextChunks.map((chunk) =>
          embeddingService.embed(chunk, "RETRIEVAL_DOCUMENT")
        )
      );

      const points = contextChunks.map((chunk, i) => ({
        id: crypto.randomUUID(),
        vector: embeddings[i],
        payload: {
          ...outboxEvent.payload.metadata,       
          sourceId: outboxEvent.payload.sourceId.toString(),
          sourceType: outboxEvent.payload.sourceType,
          userId: outboxEvent.payload.userId.toString(),
          content: { fact: chunk },              
        },
      }));

      await this.vectorRepository.upsertSummaryVectors(points);

      console.log(
        `✅ Embedded ${points.length} fact chunks for outbox ${summaryOutboxEventId}`
      );

      await this.outboxRepository.updateStatus(
        summaryOutboxEventId,
        "processed"
      );
    } catch (error: any) {
      await this.outboxRepository.updateStatus(
        summaryOutboxEventId,
        "failed",
        { error: error.message, incrementRetry: true }
      );
      console.error(`❌ ProcessSummaryJob failed:`, error.message);
      throw error;
    }
  }
}