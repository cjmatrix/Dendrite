import { IMessageRepository } from '../../../domain/chat/repositories/IMessageRepository';
import { Message } from '../models/MongoMessageModel';
import { MongooseBaseRepository } from '../../shared/MongooseBaseRepository';
import { IMessage } from '../../../domain/chat/entities/Message';

export class MongoMessageRepository extends MongooseBaseRepository<IMessage> implements IMessageRepository {
  constructor() {
    super(Message);
  }

  async findMessages(query: any, limit: number, cursor?: string | null): Promise<IMessage[]> {
    const dbQuery: any = { ...query };
    if (cursor) {
      dbQuery._id = { $lt: cursor };
    }
    const docs = await this.model.find(dbQuery).sort({ _id: -1 }).limit(limit).lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async createMany(messagesData: any[], options?: any): Promise<IMessage[]> {
    const docs = await this.model.create(messagesData, options);
    return docs.map((doc: any) => this.mapToDomain(doc.toObject ? doc.toObject() : doc));
  }

  async findRecentByChatId(chatId: string, limit: number, options?: any): Promise<IMessage[]> {
    let query = this.model.find({ chatId }).sort({ createdAt: -1 }).limit(limit);
    if (options && options.session) {
      query = query.session(options.session);
    }
    const docs = await query.lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async countByChatId(chatId: string, options?: any): Promise<number> {
    let query = this.model.countDocuments({ chatId });
    if (options && options.session) {
      query = query.session(options.session);
    }
    return query.exec();
  }

  async findAnchorContext(chatId: string, createdAt: Date, limit: number): Promise<IMessage[]> {
    const docs = await this.model.find({
      chatId,
      createdAt: { $lte: createdAt },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async findByIdsAndDelete(chatId: string, userId: string): Promise<void> {
    await this.model.deleteMany({ chatId, userId }).session(this.getSession());
  }
}
