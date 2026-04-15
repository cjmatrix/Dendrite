import { Queue, Worker } from 'bullmq';

import { DIContainer } from '../controllers/container/DIContainer';
import { ProcessDocumentChunking } from '../application/worker/use-cases/ProcessDocumentChunking';

import { redisConfig } from '../config/redis';

export const documentChunkingQueue = new Queue('document-chunking', { connection:redisConfig});

interface DocumentChunkingJob {
  outboxId: string;
  filePath: string;
  userId: string;
  chatId: string;
  fileName: string;
}

// Worker
new Worker(
  'document-chunking',
  async (job: any) => {
    const { outboxId, filePath, userId, chatId, fileName } = job.data as DocumentChunkingJob;

    const outboxRepo = DIContainer.getOutboxEventRepository();
    const vectorRepo = DIContainer.getVectorRepository();

    const processor = new ProcessDocumentChunking(outboxRepo, vectorRepo);
    await processor.execute(outboxId, filePath, userId, chatId, fileName);
  },
  {
    connection: redisConfig,
    concurrency: 2, // Limit concurrent chunking jobs
  }
);

documentChunkingQueue.on('completed' as any, (job: any) => {
  console.log(`✅ Document chunking job ${job.id} completed`);
});

documentChunkingQueue.on('failed' as any, (job: any, err: any) => {
  console.error(`❌ Document chunking job ${job?.id} failed:`, err.message);
});

export default documentChunkingQueue;
