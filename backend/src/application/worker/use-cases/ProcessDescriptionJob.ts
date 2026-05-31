import { injectable, inject } from "tsyringe";
import { ICodeBlockRepository } from '../../../domain/chat/repositories/ICodeBlockRepository';
import { IOutboxEventRepository } from '../../../domain/outbox/repositories/IOutboxEventRepository';
import { IEmbeddingPublisher } from '../../common/ports/IEmbeddingPublisher';
import { generateBatchCodeDescriptions } from '../../../utils/AIDescription';
import mongoose from "mongoose";

@injectable()
export class ProcessDescriptionJob {
  constructor(
    @inject("ICodeBlockRepository") private codeBlockRepository: ICodeBlockRepository,
    @inject("IOutboxEventRepository") private outboxRepository: IOutboxEventRepository,
    @inject("RedisClient") private redisConnection: any, 
    @inject("IEmbeddingPublisher") private embeddingPublisher: IEmbeddingPublisher
  ) {}

  async execute(blocks: any[]) {
    const finalResults: { [key: string]: string } = {};
    const toProcessBlocks: typeof blocks = [];

    
    for (const block of blocks) {
      const redisKey = `code_dedup:${block.hash}`;
      const cachedDescription = await this.redisConnection.get(redisKey);
      
      if (cachedDescription) {
        console.log(`[DescWorker] Hash cache hit for ${block.hash.slice(0, 8)}... — skipping Gemini call.`);
        finalResults[block._id] = cachedDescription;
      } else {
        toProcessBlocks.push(block);
      }
    }
    
  
    if (toProcessBlocks.length > 0) {
      console.log(` Batching description generation for ${toProcessBlocks.length} blocks...`);
      
      const batchResults = await generateBatchCodeDescriptions(
        toProcessBlocks.map(b => ({ id: b._id, code: b.code, language: b.language }))
      );

      for (const res of batchResults) {
        finalResults[res.id] = res.description;
        const originalBlock = toProcessBlocks.find(b => b._id === res.id);
        if (originalBlock) {
          await this.redisConnection.setex(`code_dedup:${originalBlock.hash}`, 86400, res.description);
        }
      }
    }

    
    const codeBlockUpdates = [];
    const outboxEventsToPush = [];

    for (const block of blocks) {
      const description = finalResults[block._id];
      if (!description) continue; 

      codeBlockUpdates.push({
        updateOne: {
          filter: { _id: block._id },
          update: { $set: { description } },
        },
      });

      outboxEventsToPush.push({
        eventType: "CODE_BLOCK_CREATED",
        payload: {
          sourceId: block._id,
          sourceType: "code_block",
          userId: block.userId,
          content: {
            code: block.code,
            description,
          },
          metadata: { language: block.language, chatId: block.chatId },
        },
        status: "pending",
      });
    }

    
    if (codeBlockUpdates.length > 0) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await this.codeBlockRepository.bulkUpdateDescriptions(codeBlockUpdates, session);
        const savedOutboxEvents = await this.outboxRepository.insertMany(outboxEventsToPush, session);

        await session.commitTransaction();

      
        for (const event of savedOutboxEvents) {
          try {
            await this.embeddingPublisher.publish(event._id.toString(), event.payload.content);
          } catch (e: any) {
            console.error(`Status: Failed to push to embedding queue for ${event.payload.sourceId}:`, e.message);
          }
        }
      } catch (txnError) {
        console.log(" Code Block update or Outbox event creation failed ");
        await session.abortTransaction();
        throw txnError;
      } finally {
        session.endSession();
      }
    }
  }
}
