import { Queue } from "bullmq";
import { redisConfig } from "../config/redis";
import { IOutboxEvent } from "../models/OutboxEvent";
const embeddingQueue = new Queue("embedding-queue", {
  connection: redisConfig,
});


export default async function embeddingCodeDesc(outboxTask:IOutboxEvent,content:string){
    await embeddingQueue.add('process-vector', { 
      outboxId: outboxTask._id, 
      text: content
    }, { attempts: 5, backoff: { type: 'exponential', delay: 1000 } });
}
