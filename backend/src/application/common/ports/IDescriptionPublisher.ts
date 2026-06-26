import { ICodeBlock } from "../../../domain/chat/entities/CodeBlock";

export interface IDescriptionPublisher {
  publish(blocks: Pick<ICodeBlock, '_id' | 'userId' | 'chatId' | 'code' | 'language' | 'hash'>[]): Promise<void>;
}
