import { IUploadedDocumentRepository } from "../../../domain/chat/repositories/IUploadedDocumentRepository";
import { UploadedDocument } from "../models/MongoUploadedDocumentModel";
import { MongooseBaseRepository } from "../../shared/BaseRepository";
import { IUploadedDocument } from "../../../domain/chat/entities/UploadedDocument";

export class MongoUploadedDocumentRepository
  extends MongooseBaseRepository<IUploadedDocument>
  implements IUploadedDocumentRepository
{
  constructor() {
    super(UploadedDocument);
  }

  async findByChatId(chatId: string): Promise<IUploadedDocument[]> {
    const docs = await this.model.find({ chatId }).session(this.getSession()).lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async findByChatIds(chatIds: string[]): Promise<IUploadedDocument[]> {
    const docs = await this.model.find({ chatId: { $in: chatIds } }).session(this.getSession()).lean();
    return docs.map((doc) => this.mapToDomain(doc));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).session(this.getSession());
    return result !== null;
  }

  async deleteManyByChatIds(chatIds: string[]): Promise<boolean> {
    const result = await this.model.deleteMany({ chatId: { $in: chatIds } }).session(this.getSession());
    return (result.deletedCount ?? 0) > 0;
  }

  async countByContentHash(contentHash: string): Promise<number> {
    return this.model.countDocuments({ contentHash }).session(this.getSession());
  }

  async findByChatIdAndFilename(chatId: string, filename: string): Promise<IUploadedDocument | null> {
    const doc = await this.model.findOne({ chatId, filename }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async findByChatIdAndFileUrl(chatId: string, fileUrl: string): Promise<IUploadedDocument | null> {
    const doc = await this.model.findOne({ chatId, fileUrl }).session(this.getSession()).lean();
    return doc ? this.mapToDomain(doc) : null;
  }
}
