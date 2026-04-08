export interface IRecallRepository {
  create(recallData: any): Promise<any>;
  findByIdAndUserId(cardId: string, userId: string): Promise<any | null>;
  findDueCardsByUserId(userId: string, date: Date): Promise<any[]>;
  findAllByUserId(userId: string): Promise<any[]>;
  countDueCardsByUserId(userId: string, date: Date): Promise<number>;
  save(card: any): Promise<any>;
  deleteByCardIdAndUserId(cardId: string, userId: string): Promise<any>;
  deleteAllByUserId(userId: string): Promise<any>;
}
