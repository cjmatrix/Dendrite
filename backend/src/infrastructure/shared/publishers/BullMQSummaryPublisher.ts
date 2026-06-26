import { ISummaryPublisher } from "../../../application/common/ports/ISummaryPublisher";
import { IMessage } from "../../../domain/chat/entities/Message";
import addSummaryQueue from "../../queue/summaryQueue";

export class BullMQSummaryPublisher implements ISummaryPublisher {
  async publish(summaryOutboxEventId: string, messageToCompress: IMessage[], previousSummary?: string | null): Promise<void> {
    await addSummaryQueue(summaryOutboxEventId, messageToCompress as unknown as Record<string, unknown>[], previousSummary || null);
  }
}
