import { IDescriptionPublisher } from "../../../application/common/ports/IDescriptionPublisher";
import addDescriptionQueue from "../../../queue/descriptionQueue";

export class BullMQDescriptionPublisher implements IDescriptionPublisher {
  async publish(blocks: any[]): Promise<void> {
    await addDescriptionQueue(blocks);
  }
}
