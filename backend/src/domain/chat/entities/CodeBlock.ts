export interface ICodeBlock {
  _id: string;
  userId: string;
  chatId: string;
  code: string;
  language: string;
  description: string;
  hash: string;
  needsDescription?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
