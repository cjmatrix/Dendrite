import { IMessageRepository } from '../../../domain/chat/repositories/IMessageRepository';
import { Message } from '../../../models/Message';

export class MongoMessageRepository implements IMessageRepository {
  async findMessages(query: any, limit: number, cursor?: string | null): Promise<any[]> {
    const dbQuery: any = { ...query };
    if (cursor) {
      dbQuery._id = { $lt: cursor };
    }
    return Message.find(dbQuery).sort({ _id: -1 }).limit(limit).lean();
  }

  async create(messageData: any): Promise<any> {
    return Message.create(messageData);
  }

  async createMany(messagesData: any[], options?: any): Promise<any[]> {
    return Message.create(messagesData, options);
  }

  async findRecentByChatId(chatId: string, limit: number, options?: any): Promise<any[]> {
    let query = Message.find({ chatId }).sort({ createdAt: -1 }).limit(limit);
    if (options && options.session) {
      query = query.session(options.session);
    }
    return query.lean();
  }

  async countByChatId(chatId: string, options?: any): Promise<number> {
    let query = Message.countDocuments({ chatId });
    if (options && options.session) {
      query = query.session(options.session);
    }
    return query.exec();
  }

  async findById(messageId: string): Promise<any | null> {
    return Message.findById(messageId);
  }

  async findAnchorContext(chatId: string, createdAt: Date, limit: number): Promise<any[]> {
    return Message.find({
      chatId,
      createdAt: { $lte: createdAt },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}
