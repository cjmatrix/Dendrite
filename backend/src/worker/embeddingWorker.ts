import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis";
import { generateEmbedding } from "../utils/embedding";
import { OutboxEvent } from "../models/OutboxEvent";
import { qdrantClient, COLLECTION_NAME } from "../config/qdrant";
import crypto from "crypto";

interface EmbeddingJobData {
  outboxId: string;
  content: any;
}

const embeddingWorker = new Worker<EmbeddingJobData>(
  "embedding-queue",
  async (job: Job<EmbeddingJobData>) => {
    const { outboxId, content } = job.data;

    try {
      const outboxEvent = await OutboxEvent.findById(outboxId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${outboxId}`);
      }

      const [codeEmbedding, descriptionEmbedding] = await Promise.all([
        generateEmbedding(content.code, "RETRIEVAL_DOCUMENT"),
        generateEmbedding(content.description, "RETRIEVAL_DOCUMENT"),
      ]);

      

      await qdrantClient.upsert(COLLECTION_NAME, {
        points: [
          {
            id: crypto.randomUUID(),
            vector:{
              code:codeEmbedding,
              description: descriptionEmbedding,
            },
            payload: {
              sourceId: outboxEvent.payload.sourceId.toString(),
              sourceType: outboxEvent.payload.sourceType,
              userId: outboxEvent.payload.userId.toString(),
              content: outboxEvent.payload.content,
              ...outboxEvent.payload.metadata, // e.g. language, chatId
            },
          },
        ],
      });

      console.log(`✅ Embedded outbox ${outboxId}  dims)`);

      await OutboxEvent.findByIdAndUpdate(outboxId, {
        status: "processed",
        processedAt: new Date(),
      });
    } catch (error: any) {
      // console.error(`❌ Embedding failed for ${outboxId}:`, error.message);

      await OutboxEvent.findByIdAndUpdate(outboxId, {
        status: "failed",
        error: error.message,
        $inc: { retryCount: 1 },
      });
      console.log(error.message);
      throw error; // BullMQ will retry
    }
  },
  {
    connection: redisConfig,
    concurrency: 3,
  },
);

embeddingWorker.on("completed", (job) => {
  console.log(`📦 Job ${job.id} completed`);
});

embeddingWorker.on("failed", (job, err) => {
  console.error(`📦 Job ${job?.id} failed:`, err.message);
});

export default embeddingWorker;
