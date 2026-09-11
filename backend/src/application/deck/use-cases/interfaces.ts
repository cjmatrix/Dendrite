export interface ICreateDeckUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, name: string, color?: string): Promise<any>;
}

export interface IGetDecksUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string): Promise<any>;
}

export interface IUpdateDeckUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, deckId: string, updates: { name?: string; color?: string }): Promise<any>;
}

export interface IDeleteDeckUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, deckId: string): Promise<any>;
}

export interface IMoveCardToDeckUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, cardId: string, deckId: string | null): Promise<any>;
}

export interface IMoveCardsToDeckUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, fromDeckId: string | null, toDeckId: string | null): Promise<any>;
}

export interface IGetDeckStatsUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string): Promise<any>;
}
