import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { Chat } from '../models/MongoChatModel';
import { MongooseBaseRepository } from '../../shared/MongooseBaseRepository';
import { IChat } from '../../../domain/chat/entities/Chat';

export class MongoChatRepository extends MongooseBaseRepository<IChat> implements IChatRepository {
  constructor() {
    super(Chat);
  }

  async findByUserIdAndTitleAndFolderId(userId: string, title: string, folderId: string | null): Promise<IChat | null> {
    const doc = await this.model.findOne({ userId, title, folderId }).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findAllByUserId(userId: string): Promise<IChat[]> {
    const docs = await this.model.find({ userId }).select("-messages").sort({ createdAt: 1 }).lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async findByIdAndUserId(chatId: string, userId: string, options?: any): Promise<IChat | null> {
    const activeSession = (options && options.session) || this.getSession();
    const finalOptions = activeSession ? { session: activeSession, ...options } : options;
    const doc = await this.model.findOne({ _id: chatId, userId }, null, finalOptions)
      .populate('contextParent', 'title _id')
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async update(chatId: string, userId: string, updates: any, options?: any): Promise<IChat | null> {
    const activeSession = (options && options.session) || this.getSession();
    const finalOptions = activeSession ? { session: activeSession, ...options } : options;
    const doc = await this.model.findOneAndUpdate({ _id: chatId, userId }, updates, { new: true, ...finalOptions }).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async bulkResetUnsummarizedCount(chatIds: string[], userId: string, options?: any): Promise<any> {
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
    const finalOptions = activeSession ? { session: activeSession, ...options } : options;
    return this.model.bulkWrite(updates, finalOptions);
  }

  async delete(chatId: string, userId: string): Promise<IChat | null> {
    const doc = await this.model.findOneAndDelete({ _id: chatId, userId }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByFolderIds(userId: string, folderIds: string[]): Promise<IChat[]> {
    const docs = await this.model.find({ folderId: { $in: folderIds }, userId }).lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async deleteManyByFolderIds(userId: string, folderIds: string[]): Promise<any> {
    return this.model.deleteMany({ folderId: { $in: folderIds }, userId });
  }

  async addDocumentToChat({chatId, userId}: {chatId: string, userId: string}, documentData: {
    fileType: 'image' | 'document';
    filename: string;
    extension: string;
    fileUrl: string;
  }): Promise<IChat | null> {
    const doc = await this.model.findOneAndUpdate(
      { _id: chatId, userId },
      {
        $push: {
          documents: {
            ...documentData,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true }
    ).lean();
    return doc ? this.mapToDomain(doc) : null;
  }
}
