import { IRecallPublisher } from "../../../application/common/ports/IRecallPublisher";
import { scheduleRecallNotification, recallQueue } from "../../queue/recallQueue";

export class BullMQRecallPublisher implements IRecallPublisher {
  async publish(
    userId: string,
    cardId: string,
    delayInMs: number,
    existingJobId?: string | null
  ): Promise<string | undefined> {
    return scheduleRecallNotification(userId, cardId, delayInMs, existingJobId);
  }

  async cancel(jobId: string): Promise<void> {
    await recallQueue.remove(jobId);
  }
}
