import { Worker, Job } from "bullmq";
import { redisConfig, redisConnection } from "../config/redis";
import { MongoOutboxEventRepository } from "../infrastructure/outbox/repositories/MongoOutboxEventRepository";
import { QdrantVectorRepository } from '../infrastructure/vector/repositories/QdrantVectorRepository';
import { ProcessSummaryJob } from "../application/worker/use-cases/ProcessSummaryJob";

interface SummaryJobData {
  summaryOutboxEventId: string;
  messageToCompress: any[];
}

const summaryWorker = new Worker<SummaryJobData>(
  "summaryQueue",
  async (job: Job<SummaryJobData>) => {
    const { summaryOutboxEventId, messageToCompress } = job.data;
    
    const outboxRepo = new MongoOutboxEventRepository();
    const vectorRepo = new QdrantVectorRepository();
    const processSummaryUseCase = new ProcessSummaryJob(outboxRepo, vectorRepo);

    await processSummaryUseCase.execute(summaryOutboxEventId, messageToCompress);
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
