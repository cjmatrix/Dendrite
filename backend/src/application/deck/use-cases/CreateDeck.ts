import { injectable, inject } from "tsyringe";
import { IDeckRepository } from "../../../domain/recall/repositories/IDeckRepository";
import { ICreateDeckUseCase } from "./interfaces";
import { AppError } from "../../../utils/AppError";

@injectable()
export class CreateDeck implements ICreateDeckUseCase {
  constructor(
    @inject("IDeckRepository") private deckRepository: IDeckRepository
  ) {}

  async execute(userId: string, name: string, color?: string) {
    const existing = await this.deckRepository.findByNameAndUserId(name, userId);
    if (existing) {
      throw new AppError("A deck with this name already exists", 409);
    }

    return await this.deckRepository.create({
      userId,
      name,
      color: color || "#8b5cf6",
    });
  }
}
