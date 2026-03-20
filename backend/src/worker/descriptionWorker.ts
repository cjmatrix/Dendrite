import { Worker, Job } from "bullmq";
import { redisConfig, redisConnection } from "../config/redis";
import { CodeBlock } from "../models/CodeBlock";
import { OutboxEvent } from "../models/OutboxEvent";
import { generateBatchCodeDescriptions } from "../utils/AIDescription";
import embeddingCodeDesc from "../queue/embeddingQueue";
import mongoose from "mongoose";

interface DescriptionJobData {
  blocks: {
    _id: string;
    userId: string;
    chatId: string;
    code: string;
    language: string;
  }[];
}

const descriptionWorker = new Worker<DescriptionJobData>(
  "description-queue",
  async (job: Job<DescriptionJobData>) => {
    const { blocks } = job.data;
    const finalResults: { [key: string]: string } = {};
    const toProcessBlocks: typeof blocks = [];

  
    for (const block of blocks) {
      const redisKey = `desc:${block._id}`;
      const cachedDescription = await redisConnection.get(redisKey);
      
      if (cachedDescription) {
        finalResults[block._id] = cachedDescription;
      } else {
        toProcessBlocks.push(block);
      }
    }


    if (toProcessBlocks.length > 0) {
      try {
        console.log(`🤖 Batching description generation for ${toProcessBlocks.length} blocks...`);
        
        const batchResults = await generateBatchCodeDescriptions(
          toProcessBlocks.map(b => ({ id: b._id, code: b.code, language: b.language }))
        );

     
        for (const res of batchResults) {
          finalResults[res.id] = res.description;
          await redisConnection.setex(`desc:${res.id}`, 3600, res.description);
        }
      } catch (error: any) {
        console.error(`❌ Batch Description generation failed:`, error.message);
        throw error;
      }
    }

    // 3. Prepare Updates and Outbox Events
    const codeBlockUpdates = [];
    const outboxEventsToPush = [];

    for (const block of blocks) {
      const description = finalResults[block._id];
      if (!description) continue; // Skip if somehow AI didn't return a description for this ID

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

    // 4. Bulk Write to DB
    if (codeBlockUpdates.length > 0) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        await CodeBlock.bulkWrite(codeBlockUpdates, { session });

        const savedOutboxEvents = await OutboxEvent.insertMany(
          outboxEventsToPush,
          { session },
        );

        await session.commitTransaction();

        // 5. Trigger Embeddings
        for (const event of savedOutboxEvents) {
          try {
            await embeddingCodeDesc(event, event.payload.content);
          } catch (e: any) {
            console.error(
              `Status: Failed to push to embedding queue for ${event.payload.sourceId}:`,
              e.message,
            );
          }
        }
      } catch (txnError) {
        console.log("❌❌ Code Block update or Outbox event creation failed ❌❌");
        await session.abortTransaction();
        throw txnError;
      } finally {
        session.endSession();
      }
    }
  },
  {
    connection: redisConfig,
    concurrency: 1,
    limiter: {
      max: 12,
      duration: 60000,
    },
  },
);

descriptionWorker.on("completed", (job) => {
  console.log(`📝 Description Job ${job.id} completed successfully`);
});

descriptionWorker.on("failed", (job, err) => {
  console.error(`📝 Description Job ${job?.id} failed:`, err.message);
});

export default descriptionWorker;

