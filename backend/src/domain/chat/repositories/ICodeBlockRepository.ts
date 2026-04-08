export interface ICodeBlockRepository {
  findStrandedBlocks(limit: number, beforeDate: Date): Promise<any[]>;
  bulkUpdateDescriptions(updates: any[], session?: any): Promise<any>;
}
