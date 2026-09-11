export interface IRecallCard {
  _id: string;
  userId: string;
  chatId: string;
  deckId?: string | null;
  breadCrumbs: string[];
  content: string;
  question?: string;
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
  findDueCardsByUserIdAndDeck(userId: string, date: Date, deckId: string | null): Promise<IRecallCard[]>;
  moveCardToDeck(userId: string, cardId: string, deckId: string | null): Promise<IRecallCard | null>;
  moveCardsToDeck(userId: string, fromDeckId: string | null, toDeckId: string | null): Promise<{ modifiedCount?: number }>;
  clearDeckReference(userId: string, deckId: string): Promise<{ modifiedCount?: number }>;
  getDeckStatsByUserId(userId: string): Promise<IRecallDeckStats>;
}

export interface IDeckCardStats {
  cardCount: number;
  dueCardCount: number;
}

export interface IRecallDeckStats {
  byDeck: Record<string, IDeckCardStats>;
  undecked: IDeckCardStats;
  total: IDeckCardStats;
}
