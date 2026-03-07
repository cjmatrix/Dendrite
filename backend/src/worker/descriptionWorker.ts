import { Worker, Job } from "bullmq";
import { redisConfig, redisConnection } from "../config/redis";
import { CodeBlock } from "../models/CodeBlock";
import { OutboxEvent } from "../models/OutboxEvent";
import generateCodeDescription from "../utils/AIDescription";
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
    const codeBlockUpdates = [];
    const outboxEventsToPush = [];

    for (const block of blocks) {
      try {
        let redisKey = `desc:${block._id}`;
        let description = await redisConnection.get(redisKey);

        if (description) {
          console.log(
            `⏩ Cache hit for block ${block._id}, skipping AI generation.`,
          );
        } else {
          description = await generateCodeDescription(
            block.code,
            block.language,
          );

          await redisConnection.setex(redisKey, 3600, description);
          console.log(
            `✅ Generated AI description natively for block: ${block._id}`,
          );

          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

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
      } catch (error: any) {
        console.error(
          `❌❌❌❌❌ Description generation failed for block ${block._id}:❌❌❌❌❌`,
          error.message,
        );
        throw error;
      }
    }

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
        console.log(
          "❌❌ Code BLock update or Outbox event creation something failed ❌❌",
        );
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
