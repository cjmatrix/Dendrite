import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";
import { ICodeBlock } from "../entities/CodeBlock";

export interface ICodeBlockRepository extends IBaseRepository<ICodeBlock> {
  findStrandedBlocks(limit: number, beforeDate: Date): Promise<ICodeBlock[]>;
  findUndescribedByChatId(chatId: string): Promise<ICodeBlock[]>;
  markUndescribedAsNeedingDescription(chatId: string, session?: unknown): Promise<void>;
  bulkUpdateDescriptions(updates: Record<string, unknown>[], session?: unknown): Promise<unknown>;
  findByHash(hash: string): Promise<ICodeBlock | null>;
  insertMany(blocks: Partial<ICodeBlock>[], session?: unknown): Promise<ICodeBlock[]>;
  deleteByChatId(chatId: string, userId: string): Promise<void>;
}
