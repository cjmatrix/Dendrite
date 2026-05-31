export interface ICodeBlock {
  _id: string;
  userId: string;
  chatId: string;
  code: string;
  language: string;
  description: string;
  hash: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}
