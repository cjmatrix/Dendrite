import { ISubChatRepository } from "../../../domain/chat/repositories/ISubChatRepository";
import { SubChat } from "../models/MongoSubChatModel";
import mongoose from "mongoose";
import { MongooseBaseRepository } from "../../shared/BaseRepository";
import { ISubChat } from "../../../domain/chat/entities/SubChat";

export class MongoSubChatRepository
  extends MongooseBaseRepository<ISubChat>
  implements ISubChatRepository
{
  constructor() {
    super(SubChat);
  }

  async findByAnchorMessageIdsAndChatId(
    anchorMessageIds: string[],
    chatId: string,
    userId: string,
  ): Promise<ISubChat[]> {
    const docs = await this.model
      .find({
        anchorMessageId: { $in: anchorMessageIds },
        chatId: new mongoose.Types.ObjectId(chatId),
        userId: new mongoose.Types.ObjectId(userId),
      })
      .select("anchorMessageId relativeY highlightedText")
      .lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async findByIdAndUserId(
    subChatId: string,
    chatId: string,
    userId: string,
  ): Promise<ISubChat | null> {
    const doc = await this.model
      .findOne({
        chatId,
        _id: subChatId,
        userId,
      })
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async update(
    subChatId: string,
    userId: string,
    updates: Partial<ISubChat>,
  ): Promise<ISubChat | null> {
    const doc = await this.model
      .findOneAndUpdate({ _id: subChatId, userId }, updates, { new: true })
      .lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async deleteByChatId(chatId: string, userId: string): Promise<void> {
    await this.model.deleteMany({ chatId, userId }).session(this.getSession());
  }
}
