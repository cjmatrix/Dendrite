import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { ICodeBlock } from "../entities/CodeBlock";

export interface ICodeBlockRepository extends IBaseRepository<ICodeBlock> {
  findStrandedBlocks(limit: number, beforeDate: Date): Promise<ICodeBlock[]>;
  findUndescribedByChatId(chatId: string): Promise<ICodeBlock[]>;
  bulkUpdateDescriptions(updates: any[], session?: any): Promise<any>;
  findByHash(hash: string): Promise<ICodeBlock | null>;
  insertMany(blocks: any[], session?: any): Promise<ICodeBlock[]>;
  deleteByChatId(chatId: string, userId: string): Promise<void>;
}
