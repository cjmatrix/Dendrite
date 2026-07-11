export interface ICreateCardUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, content: string, chatId: string): Promise<any>;
}

export interface IUpdateCardUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, cardId: string, rating: number): Promise<any>;
}

export interface IGetDueCardsUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string): Promise<any>;
}

export interface IDeleteCardUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, cardId: string): Promise<any>;
}

export interface IClearAllCardsUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string): Promise<any>;
}

export interface ICountDueCardsUseCase {
  execute(userId: string): Promise<number>;
}

