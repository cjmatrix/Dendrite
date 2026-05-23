import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';
import { SubChat } from '../models/MongoSubChatModel';
import mongoose from "mongoose";

export class MongoSubChatRepository implements ISubChatRepository {
  async findByAnchorMessageIdsAndChatId(anchorMessageIds: any[], chatId: string): Promise<any[]> {
    return SubChat.find({
      anchorMessageId: { $in: anchorMessageIds },
      chatId: new mongoose.Types.ObjectId(chatId)
    }).select('anchorMessageId relativeY').lean();
  }

  async findByIdAndUserId(subChatId: string, chatId: string, userId: string): Promise<any | null> {
    return SubChat.findOne({
      chatId,
      _id: subChatId,
      userId
    }).lean();
  }

  async update(subChatId: string, userId: string, updates: any): Promise<any | null> {
    return SubChat.findOneAndUpdate(
      { _id: subChatId, userId },
      updates,
      { new: true }
    );
  }

  async create(subChatData: any): Promise<any> {
    return SubChat.create(subChatData);
  }
}
