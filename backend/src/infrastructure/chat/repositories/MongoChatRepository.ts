import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { Chat } from '../../../models/Chat';

export class MongoChatRepository implements IChatRepository {
  async findByUserIdAndTitleAndFolderId(userId: string, title: string, folderId: string | null): Promise<any | null> {
    return Chat.findOne({ userId, title, folderId });
  }

  async create(chatData: any): Promise<any> {
    return Chat.create(chatData);
  }

  async findAllByUserId(userId: string): Promise<any[]> {
    return Chat.find({ userId }).select("-messages").sort({ createdAt: 1 }).lean();
  }

  async findByIdAndUserId(chatId: string, userId: string, options?: any): Promise<any | null> {
    return Chat.findOne({ _id: chatId, userId }, null, options).lean();
  }

  async update(chatId: string, userId: string, updates: any, options?: any): Promise<any | null> {
    return Chat.findOneAndUpdate({ _id: chatId, userId }, updates, { new: true, ...options });
  }

  async delete(chatId: string, userId: string): Promise<any | null> {
    return Chat.findOneAndDelete({ _id: chatId, userId });
  }

  async findByFolderIds(userId: string, folderIds: string[]): Promise<any[]> {
    return Chat.find({ folderId: { $in: folderIds }, userId }).lean();
  }

  async deleteManyByFolderIds(userId: string, folderIds: string[]): Promise<any> {
    return Chat.deleteMany({ folderId: { $in: folderIds }, userId });
  }
}
