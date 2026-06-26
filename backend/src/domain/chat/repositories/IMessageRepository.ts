import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { IMessage } from "../entities/Message";

export interface IMessageRepository extends IBaseRepository<IMessage> {
  findMessages(query: Record<string, unknown>, limit: number, cursor?: string | null): Promise<IMessage[]>;
  createMany(messagesData: Partial<IMessage>[], options?: { session?: unknown }): Promise<IMessage[]>;
  findRecentByChatId(chatId: string, limit: number, options?: { session?: unknown }): Promise<IMessage[]>;
  countByChatId(chatId: string, options?: { session?: unknown }): Promise<number>;
  findAnchorContext(chatId: string, createdAt: Date, limit: number): Promise<IMessage[]>;
  findByIdsAndDelete(chatId: string, userId: string): Promise<void>;
  findAllByChatId(chatId: string): Promise<IMessage[]>;
  findAllByChatIds(chatIds: string[]): Promise<IMessage[]>;
}
