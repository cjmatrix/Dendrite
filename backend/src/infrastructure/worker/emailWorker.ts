import { Worker, Job } from "bullmq";
import { redisConfig } from "../../config/redis";
import { ProcessEmailJob } from "../../application/worker/use-cases/ProcessEmailJob";
import { container } from "tsyringe";

interface EmailJobData {
  email: string;
  otp?: string;
  token?: string;
}

const emailWorker = new Worker<EmailJobData>(
  "email-queue",
  async (job: Job<EmailJobData>) => {
    const processEmailUseCase = container.resolve(ProcessEmailJob);
    await processEmailUseCase.execute(job.name as "otp" | "password-reset", job.data);
  },
  {
    connection: redisConfig,
    concurrency: 5,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Email Job ${job.id} of name ${job.name} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email Job ${job?.id} of name ${job?.name} failed:`, err.message);
});

export default emailWorker;
