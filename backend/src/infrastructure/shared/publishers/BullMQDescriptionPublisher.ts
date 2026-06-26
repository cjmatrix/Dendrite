import { IDescriptionPublisher } from "../../../application/common/ports/IDescriptionPublisher";
import { ICodeBlock } from "../../../domain/chat/entities/CodeBlock";
import addDescriptionQueue from "../../queue/descriptionQueue";

export class BullMQDescriptionPublisher implements IDescriptionPublisher {
  async publish(blocks: Pick<ICodeBlock, '_id' | 'userId' | 'chatId' | 'code' | 'language' | 'hash'>[]): Promise<void> {
    await addDescriptionQueue(blocks as unknown as Record<string, unknown>[]);
  }
}
