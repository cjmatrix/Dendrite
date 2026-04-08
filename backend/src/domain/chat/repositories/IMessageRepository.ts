export interface IMessageRepository {
  findMessages(query: any, limit: number, cursor?: string | null): Promise<any[]>;
  create(messageData: any): Promise<any>;
  createMany(messagesData: any[], options?: any): Promise<any[]>;
  findRecentByChatId(chatId: string, limit: number, options?: any): Promise<any[]>;
  countByChatId(chatId: string, options?: any): Promise<number>;
  findById(messageId: string): Promise<any | null>;
  findAnchorContext(chatId: string, createdAt: Date, limit: number): Promise<any[]>;
}
