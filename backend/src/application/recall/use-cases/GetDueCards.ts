import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IGetDueCardsUseCase } from "./interfaces";

@injectable()
export class GetDueCards implements IGetDueCardsUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string, deckId?: string | null) {
    const now = new Date();
    if (deckId !== undefined) {
      return await this.recallRepository.findDueCardsByUserIdAndDeck(userId, now, deckId);
    }
    return await this.recallRepository.findDueCardsByUserId(userId, now);
  }
}
