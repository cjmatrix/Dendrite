import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { IMessage } from "../entities/Message";

export interface IMessageRepository extends IBaseRepository<IMessage> {
  findMessages(query: any, limit: number, cursor?: string | null): Promise<IMessage[]>;
  createMany(messagesData: any[], options?: any): Promise<IMessage[]>;
  findRecentByChatId(chatId: string, limit: number, options?: any): Promise<IMessage[]>;
  countByChatId(chatId: string, options?: any): Promise<number>;
  findAnchorContext(chatId: string, createdAt: Date, limit: number): Promise<IMessage[]>;
  findByIdsAndDelete(chatId: string, userId: string): Promise<void>;
}
