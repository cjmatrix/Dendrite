import { Worker, Job } from "bullmq";
import { redisConfig, redisConnection } from "../config/redis";
import { generateRecursiveSummary } from "../utils/AISummary";
import { OutboxEvent } from "../models/OutboxEvent";
import { Chat } from "../models/Chat";

interface StateJobData {
  stateOutboxEventId: string;
  messageToCompress: any[];
  previousSummary?: string | null;
}

const stateWorker = new Worker<StateJobData>(
  "stateQueue",
  async (job: Job<StateJobData>) => {
    const { stateOutboxEventId, messageToCompress, previousSummary } = job.data;

    try {
      const outboxEvent = await OutboxEvent.findById(stateOutboxEventId);
      if (!outboxEvent) {
        throw new Error(`Outbox event not found: ${stateOutboxEventId}`);
      }

      const cacheKey = `llm_summary:${stateOutboxEventId}`;
      let updatedSummary = await redisConnection.get(cacheKey);

      if (!updatedSummary) {
        console.log(`🧠 Calling LLM for new state summary (${stateOutboxEventId})`);
        
      
        updatedSummary = await generateRecursiveSummary(
          previousSummary || null,
          messageToCompress,
        );

      
        await redisConnection.setex(cacheKey, 24 * 60 * 60, updatedSummary);
      } else {
        console.log(`♻️ Found existing LLM summary in Redis for ${stateOutboxEventId}, skipping Gemini API call.`);
      }

      await Chat.findByIdAndUpdate(outboxEvent.payload.sourceId, {
        summary: updatedSummary,
      });

      console.log(
        `✅ Updated Recursive Summary for chat ${outboxEvent.payload.sourceId}`,
      );

      await OutboxEvent.findByIdAndUpdate(stateOutboxEventId, {
        status: "processed",
        processedAt: new Date(),
      });
    } catch (error: any) {
      await OutboxEvent.findByIdAndUpdate(stateOutboxEventId, {
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

stateWorker.on("completed", (job) => {
  console.log(`📦 State Job ${job.id} completed`);
});

stateWorker.on("failed", (job, err) => {
  console.error(`📦 State Job ${job?.id} failed:`, err.message);
});

export default stateWorker;
