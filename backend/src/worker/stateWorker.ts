import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis";
import { ProcessStateJob } from "../application/worker/use-cases/ProcessStateJob";
import { container } from "tsyringe";

interface StateJobData {
  stateOutboxEventId: string;
  messageToCompress: any[];
  previousSummary?: string | null;
}

const stateWorker = new Worker<StateJobData>(
  "stateQueue",
  async (job: Job<StateJobData>) => {
    const { stateOutboxEventId, messageToCompress, previousSummary } = job.data;
    const processStateUseCase = container.resolve(ProcessStateJob);

    await processStateUseCase.execute(stateOutboxEventId, messageToCompress, previousSummary);
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
