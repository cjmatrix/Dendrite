import { Worker, Job } from "bullmq";
import { redisConfig } from "../../config/redis";
import { ProcessDescriptionJob } from "../../application/worker/use-cases/ProcessDescriptionJob";
import { container } from "tsyringe";

interface DescriptionJobData {
  blocks: {
    _id: string;
    userId: string;
    chatId: string;
    code: string;
    language: string;
    hash: string;
  }[];
}

const descriptionWorker = new Worker<DescriptionJobData>(
  "description-queue",
  async (job: Job<DescriptionJobData>) => {
    const { blocks } = job.data;
    const processDescUseCase = container.resolve(ProcessDescriptionJob);

    await processDescUseCase.execute(blocks);
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

