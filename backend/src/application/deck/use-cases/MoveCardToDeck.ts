import { injectable, inject } from "tsyringe";
import { IRecallRepository } from "../../../domain/recall/repositories/IRecallRepository";
import { IMoveCardToDeckUseCase } from "./interfaces";
import { AppError } from "../../../utils/AppError";

@injectable()
export class MoveCardToDeck implements IMoveCardToDeckUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string, cardId: string, deckId: string | null) {
    const card = await this.recallRepository.moveCardToDeck(userId, cardId, deckId);
    if (!card) {
      throw new AppError("Card not found", 404);
    }

    return card;
  }
}
