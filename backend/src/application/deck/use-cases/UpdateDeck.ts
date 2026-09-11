import { injectable, inject } from "tsyringe";
import { IDeckRepository } from "../../../domain/recall/repositories/IDeckRepository";
import { IUpdateDeckUseCase } from "./interfaces";
import { AppError } from "../../../utils/AppError";

@injectable()
export class UpdateDeck implements IUpdateDeckUseCase {
  constructor(
    @inject("IDeckRepository") private deckRepository: IDeckRepository
  ) {}

  async execute(userId: string, deckId: string, updates: { name?: string; color?: string }) {
    if (updates.name) {
      const existing = await this.deckRepository.findByNameAndUserId(updates.name, userId);
      if (existing && existing._id.toString() !== deckId) {
        throw new AppError("A deck with this name already exists", 409);
      }
    }

    const deck = await this.deckRepository.update(deckId, userId, updates);
    if (!deck) {
      throw new AppError("Deck not found", 404);
    }

    return deck;
  }
}
