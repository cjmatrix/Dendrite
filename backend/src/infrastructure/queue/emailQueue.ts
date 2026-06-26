import { Queue } from "bullmq";
import { redisConfig } from "../../config/redis";

export const emailQueue = new Queue("email-queue", {
  connection: redisConfig,
});

export async function addEmailJob(
  type: "otp" | "password-reset",
  data: { email: string; otp?: string; token?: string }
): Promise<string | undefined> {
  const job = await emailQueue.add(
    type,
    data,
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );
  return job.id;
}
