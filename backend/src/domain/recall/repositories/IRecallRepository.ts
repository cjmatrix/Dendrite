export interface IRecallCard {
  _id: string;
  userId: string;
  chatId: string;
  breadCrumbs: string[];
  content: string;
  stage: 'learning' | 'review';
  stepIndex: number;
  repetitions: number;
  interval: number;
  easeFactor: number;
  nextReview: Date;
  jobId?: string;
  lastReviewed?: Date;
  createdAt?: Date;
}

export interface IRecallRepository {
  create(recallData: Partial<IRecallCard>): Promise<IRecallCard>;
  findByIdAndUserId(cardId: string, userId: string): Promise<IRecallCard | null>;
  findDueCardsByUserId(userId: string, date: Date): Promise<IRecallCard[]>;
  findAllByUserId(userId: string): Promise<IRecallCard[]>;
  countDueCardsByUserId(userId: string, date: Date): Promise<number>;
  save(card: IRecallCard): Promise<IRecallCard>;
  deleteByCardIdAndUserId(cardId: string, userId: string): Promise<IRecallCard | null>;
  deleteAllByUserId(userId: string): Promise<{ deletedCount?: number }>;
}
