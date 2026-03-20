import { redisConfig } from "../config/redis";
import { Queue } from "bullmq";

const stateQueue = new Queue("stateQueue", {
  connection: redisConfig,
});

export default async function addStateQueue(
  stateOutboxEventId: string,
  messageToCompress: any[],
  previousSummary: string | null = null,
) {
  await stateQueue.add("process-state", {
    stateOutboxEventId,
    messageToCompress,
    previousSummary,
  });
}
