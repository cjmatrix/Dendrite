export interface IDeck {
  _id: string;
  userId: string;
  name: string;
  color: string;
  cardCount?: number;
  dueCardCount?: number;
  createdAt?: Date;
}

export interface IDeckRepository {
  create(deckData: Partial<IDeck>): Promise<IDeck>;
  findAllByUserId(userId: string): Promise<IDeck[]>;
  findByIdAndUserId(deckId: string, userId: string): Promise<IDeck | null>;
  findByNameAndUserId(name: string, userId: string): Promise<IDeck | null>;
  update(deckId: string, userId: string, updates: Partial<Pick<IDeck, 'name' | 'color'>>): Promise<IDeck | null>;
  delete(deckId: string, userId: string): Promise<IDeck | null>;
}
