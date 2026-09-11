import { injectable, inject } from "tsyringe";
import { IDeckRepository } from "../../../domain/recall/repositories/IDeckRepository";
import { IRecallRepository } from "../../../domain/recall/repositories/IRecallRepository";
import { IDeleteDeckUseCase } from "./interfaces";
import { AppError } from "../../../utils/AppError";

@injectable()
export class DeleteDeck implements IDeleteDeckUseCase {
  constructor(
    @inject("IDeckRepository") private deckRepository: IDeckRepository,
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string, deckId: string) {
    const deck = await this.deckRepository.delete(deckId, userId);
    if (!deck) {
      throw new AppError("Deck not found", 404);
    }

    // Move all cards from the deleted deck to "All" (null deckId)
    await this.recallRepository.clearDeckReference(userId, deckId);

    return deck;
  }
}
