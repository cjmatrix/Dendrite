import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis";
import { ProcessRecallJob } from "../application/worker/use-cases/ProcessRecallJob";
import { container } from "tsyringe";

interface RecallJobData {
  userId: string;
  cardId: string;
}

const recallWorker = new Worker<RecallJobData>(
  "recall-queue",
  async (job: Job<RecallJobData>) => {
    const { userId, cardId } = job.data;
    const processRecallUseCase = container.resolve(ProcessRecallJob);

    await processRecallUseCase.execute(userId, cardId);
  },
  {
    connection: redisConfig,
    concurrency: 5, 
  }
);

recallWorker.on("completed", (job) => {
  console.log(`🔔 Recall Notification Job ${job.id} completed`);
});

recallWorker.on("failed", (job, err) => {
  console.error(`🔔 Recall Notification Job ${job?.id} failed:`, err.message);
});

export default recallWorker;
