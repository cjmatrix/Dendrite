import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis";
import { ProcessEmbeddingJob } from "../application/worker/use-cases/ProcessEmbeddingJob";
import { container } from "tsyringe";

interface EmbeddingJobData {
  outboxId: string;
  content: any;
}

const embeddingWorker = new Worker<EmbeddingJobData>(
  "embedding-queue",
  async (job: Job<EmbeddingJobData>) => {
    const { outboxId, content } = job.data;
    const processEmbeddingUseCase = container.resolve(ProcessEmbeddingJob);

    await processEmbeddingUseCase.execute(outboxId, content);
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
