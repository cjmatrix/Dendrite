import { Queue } from "bullmq";
import { redisConfig } from "../../config/redis";

const descriptionQueue = new Queue("description-queue", {
  connection: redisConfig,
});

export default async function addDescriptionQueue(blocks: Record<string, unknown>[]) {
  await descriptionQueue.add(
    "process-desc",
    { blocks },
    { attempts: 5, backoff: { type: "exponential", delay: 1000 } },
  );
}
