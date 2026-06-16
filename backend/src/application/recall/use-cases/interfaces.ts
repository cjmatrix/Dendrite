export interface ICreateCardUseCase {
  execute(userId: string, content: string, chatId: string): Promise<any>;
}

export interface IUpdateCardUseCase {
  execute(userId: string, cardId: string, rating: number): Promise<any>;
}

export interface IGetDueCardsUseCase {
  execute(userId: string): Promise<any>;
}

export interface IDeleteCardUseCase {
  execute(userId: string, cardId: string): Promise<any>;
}

export interface IClearAllCardsUseCase {
  execute(userId: string): Promise<any>;
}

export interface ICountDueCardsUseCase {
  execute(userId: string): Promise<number>;
}
