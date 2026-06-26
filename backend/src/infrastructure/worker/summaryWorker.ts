import { Worker, Job } from "bullmq";
import { redisConfig } from "../../config/redis";
import { ProcessSummaryJob } from "../../application/worker/use-cases/ProcessSummaryJob";
import { container } from "tsyringe";

interface SummaryJobData {
  summaryOutboxEventId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messageToCompress: any[];
  previousSummary?: string | null;
}

const summaryWorker = new Worker<SummaryJobData>(
  "summaryQueue",
  async (job: Job<SummaryJobData>) => {
    const { summaryOutboxEventId, messageToCompress, previousSummary } = job.data;
    const processSummaryUseCase = container.resolve(ProcessSummaryJob);

    await processSummaryUseCase.execute(summaryOutboxEventId, messageToCompress, previousSummary);
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
  console.log(`Summary Job ${job.id} completed`);
});

summaryWorker.on("failed", (job, err) => {
  console.error(`Summary Job ${job?.id} failed:`, err.message);
});

export default summaryWorker;
