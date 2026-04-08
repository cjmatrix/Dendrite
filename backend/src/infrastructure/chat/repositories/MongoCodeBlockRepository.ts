import { ICodeBlockRepository } from '../../../domain/chat/repositories/ICodeBlockRepository';
import { CodeBlock } from '../../../models/CodeBlock';

export class MongoCodeBlockRepository implements ICodeBlockRepository {
  async findStrandedBlocks(limit: number, beforeDate: Date): Promise<any[]> {
    return CodeBlock.find({
      description: "",
      createdAt: { $lt: beforeDate },
    }).limit(limit);
  }

  async bulkUpdateDescriptions(updates: any[], session?: any): Promise<any> {
    if (session) {
      return CodeBlock.bulkWrite(updates, { session });
    }
    return CodeBlock.bulkWrite(updates);
  }
}
