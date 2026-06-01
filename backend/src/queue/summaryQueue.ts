import { redisConfig } from "../config/redis";
import { Queue } from "bullmq";

const summaryQueue = new Queue("summaryQueue", {
  connection: redisConfig,
});

export default async function addSummaryQueue(
  summaryOutboxEventId: string,
  messageToCompress: any[],
  previousSummary: string | null = null,
) {
  await summaryQueue.add("process-summary", {
    summaryOutboxEventId,
    messageToCompress,
    previousSummary,
  });
}
