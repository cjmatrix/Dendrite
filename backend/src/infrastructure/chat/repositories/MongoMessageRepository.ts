import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { Message } from "../models/MongoMessageModel";
import { MongooseBaseRepository } from "../../shared/BaseRepository";
import { IMessage } from "../../../domain/chat/entities/Message";

export class MongoMessageRepository
  extends MongooseBaseRepository<IMessage>
  implements IMessageRepository
{
  constructor() {
    super(Message);
  }

  async findMessages(
    query: Record<string, unknown>,
    limit: number,
    cursor?: string | null,
  ): Promise<IMessage[]> {
    const dbQuery: Record<string, unknown> = { ...query };
    if (cursor) {
      dbQuery._id = { $lt: cursor };
    }
    const docs = await this.model
      .find(dbQuery)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async createMany(
    messagesData: Partial<IMessage>[],
    options?: { session?: unknown },
  ): Promise<IMessage[]> {
    const activeSession = (options && options.session) || this.getSession();
    const finalOptions = activeSession
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? { session: activeSession as any, ...options }
      : options;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs = await this.model.insertMany(messagesData, finalOptions as any) as unknown as { toObject?: () => Record<string, unknown> }[];
    return docs.map((doc) =>
      this.mapToDomain(doc.toObject ? doc.toObject() : doc),
    );
  }

  async findRecentByChatId(
    chatId: string,
    limit: number,
    options?: { session?: unknown },
  ): Promise<IMessage[]> {
    let query = this.model
      .find({ chatId })
      .sort({ createdAt: -1 })
      .limit(limit);
    const activeSession = (options && options.session) || this.getSession();
    if (activeSession) {
      query = query.session(activeSession as import("mongoose").ClientSession);
    }
    const docs = await query.lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async countByChatId(chatId: string, options?: { session?: unknown }): Promise<number> {
    let query = this.model.countDocuments({ chatId });
    const activeSession = (options && options.session) || this.getSession();
    if (activeSession) {
      query = query.session(activeSession as import("mongoose").ClientSession);
    }
    return query.exec();
  }

  async findAnchorContext(
    chatId: string,
    createdAt: Date,
    limit: number,
  ): Promise<IMessage[]> {
    const docs = await this.model
      .find({
        chatId,
        createdAt: { $lte: createdAt },
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async findByIdsAndDelete(chatId: string, userId: string): Promise<void> {
    await this.model.deleteMany({ chatId, userId }).session(this.getSession());
  }

  async findAllByChatId(chatId: string): Promise<IMessage[]> {
    const docs = await this.model
      .find({ chatId })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async findAllByChatIds(chatIds: string[]): Promise<IMessage[]> {
    const docs = await this.model
      .find({ chatId: { $in: chatIds } })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }
}
