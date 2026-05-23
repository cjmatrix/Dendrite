import { ICodeBlockRepository } from '../../../domain/chat/repositories/ICodeBlockRepository';
import { CodeBlock } from '../models/MongoCodeBlockModel';

export class MongoCodeBlockRepository implements ICodeBlockRepository {
  async findStrandedBlocks(limit: number, beforeDate: Date): Promise<any[]> {
    return CodeBlock.find({
      description: "",
      createdAt: { $lt: beforeDate },
    }).limit(limit);
  }

  async findUndescribedByChatId(chatId: string): Promise<any[]> {
    return CodeBlock.find({ chatId, description: "" }).lean();
  }

  async bulkUpdateDescriptions(updates: any[], session?: any): Promise<any> {
    if (session) {
      return CodeBlock.bulkWrite(updates, { session });
    }
    return CodeBlock.bulkWrite(updates);
  }

  async findByHash(hash: string): Promise<any | null> {
    return CodeBlock.findOne({ hash }).lean();
  }

  async insertMany(blocks: any[], session?: any): Promise<any[]> {
    if (session) {
      return CodeBlock.insertMany(blocks, { session });
    }
    return CodeBlock.insertMany(blocks);
  }
}
