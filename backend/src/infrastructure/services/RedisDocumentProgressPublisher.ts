import { injectable } from "tsyringe";
import {
  IDocumentProgressPublisher,
  DocumentProgressEvent,
} from "../../application/common/ports/IDocumentProgressPublisher";
import { documentProgressPubSub } from "../../services/documentProgressPubSub";

@injectable()
export class RedisDocumentProgressPublisher
  implements IDocumentProgressPublisher
{
  async publish(event: DocumentProgressEvent): Promise<void> {
    await documentProgressPubSub.publish(event);
  }
}
