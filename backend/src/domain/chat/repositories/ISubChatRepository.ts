export interface ISubChatRepository {
  findByAnchorMessageIdsAndChatId(anchorMessageIds: any[], chatId: string): Promise<any[]>;
  findByIdAndUserId(subChatId: string, chatId: string, userId: string): Promise<any | null>;
  update(subChatId: string, userId: string, updates: any): Promise<any | null>;
  create(subChatData: any): Promise<any>;
}
