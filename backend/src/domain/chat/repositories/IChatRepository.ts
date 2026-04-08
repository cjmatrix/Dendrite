export interface IChatRepository {
  findByUserIdAndTitleAndFolderId(userId: string, title: string, folderId: string | null): Promise<any | null>;
  create(chatData: any): Promise<any>;
  findAllByUserId(userId: string): Promise<any[]>;
  findByIdAndUserId(chatId: string, userId: string): Promise<any | null>;
  update(chatId: string, userId: string, updates: any): Promise<any | null>;
  delete(chatId: string, userId: string): Promise<any | null>;
}
