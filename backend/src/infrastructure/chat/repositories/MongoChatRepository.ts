import { Chat } from "../models/MongoChatModel";
import { IChat } from "../../../domain/chat/entities/Chat";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { MongooseBaseRepository } from "../../shared/BaseRepository";

export class MongoChatRepository
  extends MongooseBaseRepository<IChat>
  implements IChatRepository
{
  constructor() {
    super(Chat);
  }

  async findByUserId(userId: string): Promise<IChat[]> {
    const docs = await this.model
      .find({ userId })
      .sort({ createdAt: 1 })
      .lean();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async findAllByUserId(userId: string): Promise<IChat[]> {
    return this.findByUserId(userId);
  }

  async findByUserIdAndTitleAndFolderId(
    userId: string,
    title: string,
    folderId: string | null,
  ): Promise<IChat | null> {
    const doc = await this.model
      .findOne({ userId, title, folderId })
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByIdAndUserId(
    chatId: string,
    userId: string,
    options?: { session?: unknown },
  ): Promise<IChat | null> {
    const activeSession = (options && options.session) || this.getSession();
    const query = this.model.findOne({ _id: chatId, userId }, null);
    if (activeSession) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query.session(activeSession as any);
    }
    const doc = await query.populate("contextParent", "title _id").lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async update(
    chatId: string,
    userId: string,
    updates: Partial<IChat>,
    options?: { session?: unknown },
  ): Promise<IChat | null> {
    const activeSession = (options && options.session) || this.getSession();
    const query = this.model.findOneAndUpdate({ _id: chatId, userId }, updates, {
      new: true,
    });
    if (activeSession) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query.session(activeSession as any);
    }
    const doc = await query.lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async bulkResetUnsummarizedCount(
    chatIds: string[],
    userId: string,
    options?: { session?: unknown },
  ): Promise<unknown> {
    if (!chatIds.length) {
      return { modifiedCount: 0 };
    }

    const updates = chatIds.map((chatId) => ({
      updateOne: {
        filter: { _id: chatId, userId },
        update: { $set: { unsummarizedCount: 0 } },
      },
    }));

    const activeSession = (options && options.session) || this.getSession();
    const finalOptions = activeSession
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? { session: activeSession as any, ...options }
      : options;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.model.bulkWrite(updates, finalOptions as any);
  }

  async delete(chatId: string, userId: string): Promise<IChat | null> {
    const doc = await this.model
      .findOneAndDelete({ _id: chatId, userId })
      .session(this.getSession())
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByFolderIds(userId: string, folderIds: string[]): Promise<IChat[]> {
    const docs = await this.model
      .find({ folderId: { $in: folderIds }, userId })
      .lean();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async deleteManyByFolderIds(
    userId: string,
    folderIds: string[],
  ): Promise<unknown> {
    return this.model.deleteMany({ folderId: { $in: folderIds }, userId });
  }

  async addDocumentToChat(
    { chatId, userId }: { chatId: string; userId: string },
    documentId: string,
  ): Promise<IChat | null> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: chatId, userId },
        {
          $push: {
            documents: documentId,
          },
        },
        { new: true },
      )
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByFolderIdsWithoutUserId(folderIds: string[]): Promise<IChat[]> {
    const docs = await this.model
      .find({ folderId: { $in: folderIds } })
      .lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async createMany(chatsData: Partial<IChat>[], options?: { session?: unknown }): Promise<IChat[]> {
    const activeSession = (options && options.session) || this.getSession();
    const finalOptions = activeSession
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? { session: activeSession as any, ...options }
      : options;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docs = await this.model.insertMany(chatsData, finalOptions as any) as unknown as { toObject?: () => Record<string, unknown> }[];
    return docs.map((doc) =>
      this.mapToDomain(doc.toObject ? doc.toObject() : doc),
    );
  }
}
