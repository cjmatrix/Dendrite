import { injectable } from "tsyringe";
import {
  IDocumentQueue,
  QueueDocumentInput,
  QueueChunkingInput,
} from "../../application/common/ports/IDocumentQueue";
import { documentChunkingQueue } from "../../worker/documentChunkingWorker";

@injectable()
export class BullMQDocumentQueue implements IDocumentQueue {
  async enqueueChunkingJob(input: QueueDocumentInput): Promise<void> {
    await documentChunkingQueue.add(
      "chunk-document",
      {
        stage: "upload",
        ...input,
      },
      {
        jobId: input.documentId,
        priority: 10,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: {
          age: 3600,
        },
      },
    );
  }

  async enqueueChunkStage(input: QueueChunkingInput): Promise<void> {
    await documentChunkingQueue.add(
      "chunk-document",
      {
        stage: "chunk",
        ...input,
      },
      {
        jobId: `${input.documentId}-chunk`,
        priority: 10,
        attempts: 1,
      },
    );
  }
}
