import { Queue } from "bullmq";
import { redisConfig } from "../config/redis";

export const recallQueue = new Queue("recall-queue", {
  connection: redisConfig,
});

export async function scheduleRecallNotification(
  userId: string,
  cardId: string,
  delayInMs: number,
  existingJobId?: string|null
): Promise<string | undefined> {

  if (existingJobId) {
    try {
      await recallQueue.remove(existingJobId);
    } catch (e) {
      console.log(`Could not remove old recall job ${existingJobId}`, e);
    }
  }

 
  const job = await recallQueue.add(
    "send-recall-notification",
    { userId, cardId },
    {
      delay: delayInMs,
      attempts: 3, 
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false
    }
  );

  return job.id;
}
