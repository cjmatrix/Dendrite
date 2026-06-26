import { IMessage } from "../../../domain/chat/entities/Message";

export interface ISummaryPublisher {
  publish(summaryOutboxEventId: string, messageToCompress: IMessage[], previousSummary?: string | null): Promise<void>;
}
