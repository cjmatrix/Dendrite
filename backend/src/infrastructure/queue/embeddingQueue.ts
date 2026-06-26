import { Queue } from "bullmq";
import { redisConfig } from "../../config/redis";
import { IOutboxEvent } from "../outbox/models/MongoOutboxEventModel";

const embeddingQueue = new Queue("embedding-queue", {
  connection: redisConfig,
});

export default async function embeddingCodeDesc(
  outboxTask: IOutboxEvent,
  content: Record<string, unknown>,
) {
  await embeddingQueue.add(
    "process-vector",
    {
      outboxId: outboxTask._id.toString(),
      content: content,
    },
    { attempts: 5, backoff: { type: "exponential", delay: 1000 } },
  );
}
