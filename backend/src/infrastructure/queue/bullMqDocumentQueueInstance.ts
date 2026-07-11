import { Queue } from "bullmq";
import { redisConfig } from "../../config/redis";

export const documentChunkingQueue = new Queue("document-chunking", {
  connection: redisConfig,
});
