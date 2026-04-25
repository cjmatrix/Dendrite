export interface ICodeBlockRepository {
  findStrandedBlocks(limit: number, beforeDate: Date): Promise<any[]>;
  findUndescribedByChatId(chatId: string): Promise<any[]>;
  bulkUpdateDescriptions(updates: any[], session?: any): Promise<any>;
  findByHash(hash: string): Promise<any | null>;
  insertMany(blocks: any[], session?: any): Promise<any[]>;
}
