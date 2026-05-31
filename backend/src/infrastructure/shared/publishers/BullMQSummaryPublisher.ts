import { ISummaryPublisher } from "../../../application/common/ports/ISummaryPublisher";
import addSummaryQueue from "../../../queue/summaryQueue";

export class BullMQSummaryPublisher implements ISummaryPublisher {
  async publish(summaryOutboxEventId: string, messageToCompress: any[]): Promise<void> {
    await addSummaryQueue(summaryOutboxEventId, messageToCompress);
  }
}
