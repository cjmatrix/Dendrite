import { ICodeBlockRepository } from '../../../domain/chat/repositories/ICodeBlockRepository';
import { CodeBlock } from '../models/MongoCodeBlockModel';
import { MongooseBaseRepository } from '../../shared/MongooseBaseRepository';
import { ICodeBlock } from '../../../domain/chat/entities/CodeBlock';

export class MongoCodeBlockRepository extends MongooseBaseRepository<ICodeBlock> implements ICodeBlockRepository {
  constructor() {
    super(CodeBlock);
  }

  async findStrandedBlocks(limit: number, beforeDate: Date): Promise<ICodeBlock[]> {
    const docs = await this.model.find({
      description: "",
      createdAt: { $lt: beforeDate },
    }).limit(limit).lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async findUndescribedByChatId(chatId: string): Promise<ICodeBlock[]> {
    const docs = await this.model.find({ chatId, description: "" }).lean();
    return docs.map((doc: any) => this.mapToDomain(doc));
  }

  async bulkUpdateDescriptions(updates: any[], session?: any): Promise<any> {
    if (session) {
      return this.model.bulkWrite(updates, { session });
    }
    return this.model.bulkWrite(updates);
  }

  async findByHash(hash: string): Promise<ICodeBlock | null> {
    const doc = await this.model.findOne({ hash }).lean();
    return doc ? this.mapToDomain(doc) : null;
  }

  async insertMany(blocks: any[], session?: any): Promise<ICodeBlock[]> {
    let docs;
    if (session) {
      docs = await this.model.insertMany(blocks, { session });
    } else {
      docs = await this.model.insertMany(blocks);
    }
    return docs.map((doc: any) => this.mapToDomain(doc.toObject ? doc.toObject() : doc));
  }

  async deleteByChatId(chatId: string, userId: string): Promise<void> {
    await this.model.deleteMany({ chatId, userId }).session(this.getSession());
  }
}
