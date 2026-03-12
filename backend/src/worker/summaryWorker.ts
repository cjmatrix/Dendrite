import { Worker, Job } from "bullmq";
import { redisConfig, redisConnection } from "../config/redis";
import generateCompressedChat from "../utils/AISummary";
import { generateEmbedding } from "../utils/embedding";
import { OutboxEvent } from "../models/OutboxEvent";
import { qdrantClient, SUMMARY_COLLECTION_NAME } from "../config/qdrant";
import crypto from "crypto";

interface SummaryJobData {
  summaryOutboxEventId: string;
  messageToCompress: any[];
}

const summaryWorker = new Worker<SummaryJobData>(
  "summaryQueue",
  async (job: Job<SummaryJobData>) => {
    const { summaryOutboxEventId, messageToCompress } = job.data;

    try {
      const outboxEvent = await OutboxEvent.findById(summaryOutboxEventId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${summaryOutboxEventId}`);
      }

      const rawCompressedNodes =
        await generateCompressedChat(messageToCompress);

      const points = [];

      const contextChunks = rawCompressedNodes
        .split("|")
        .map((chunk) => chunk.trim())
        .filter((chunk) => chunk.length > 0);

      for (const chunk of contextChunks) {
        const embedding = await generateEmbedding(chunk, "RETRIEVAL_DOCUMENT");

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
        await qdrantClient.upsert(SUMMARY_COLLECTION_NAME, { points });
      }

      console.log(
        `✅ Embedded ${points.length} chunks for summary outbox ${summaryOutboxEventId}`,
      );

      await OutboxEvent.findByIdAndUpdate(summaryOutboxEventId, {
        status: "processed",
        processedAt: new Date(),
      });
    } catch (error: any) {
      await OutboxEvent.findByIdAndUpdate(summaryOutboxEventId, {
        status: "failed",
        error: error.message,
        $inc: { retryCount: 1 },
      });
      console.log(error.message);
      throw error;
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

summaryWorker.on("completed", (job) => {
  console.log(`📦 Summary Job ${job.id} completed`);
});

summaryWorker.on("failed", (job, err) => {
  console.error(`📦 Summary Job ${job?.id} failed:`, err.message);
});

export default summaryWorker;
