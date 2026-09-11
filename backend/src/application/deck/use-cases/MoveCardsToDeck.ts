import { injectable, inject } from "tsyringe";
import { IRecallRepository } from "../../../domain/recall/repositories/IRecallRepository";
import { IMoveCardsToDeckUseCase } from "./interfaces";

@injectable()
export class MoveCardsToDeck implements IMoveCardsToDeckUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string, fromDeckId: string | null, toDeckId: string | null) {
    return await this.recallRepository.moveCardsToDeck(userId, fromDeckId, toDeckId);
  }
}
