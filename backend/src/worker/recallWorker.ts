import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis";
import { MongoRecallRepository } from "../infrastructure/recall/repositories/MongoRecallRepository";
import { MongoUserRepository } from "../infrastructure/auth/repositories/MongoUserRepository";
import { ProcessRecallJob } from "../application/worker/use-cases/ProcessRecallJob";

interface RecallJobData {
  userId: string;
  cardId: string;
}

const recallWorker = new Worker<RecallJobData>(
  "recall-queue",
  async (job: Job<RecallJobData>) => {
    const { userId, cardId } = job.data;
    
    const recallRepo = new MongoRecallRepository();
    const userRepo = new MongoUserRepository();
    const processRecallUseCase = new ProcessRecallJob(recallRepo, userRepo);

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
