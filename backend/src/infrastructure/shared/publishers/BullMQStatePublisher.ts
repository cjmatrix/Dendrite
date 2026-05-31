import { IStatePublisher } from "../../../application/common/ports/IStatePublisher";
import addStateQueue from "../../../queue/stateQueue";

export class BullMQStatePublisher implements IStatePublisher {
  async publish(
    stateOutboxEventId: string,
    messageToCompress: any[],
    previousSummary?: string | null
  ): Promise<void> {
    await addStateQueue(stateOutboxEventId, messageToCompress, previousSummary || null);
  }
}
