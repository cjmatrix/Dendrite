import { injectable, inject } from "tsyringe";
import { IRecallRepository } from "../../../domain/recall/repositories/IRecallRepository";
import { AppError } from "../../../utils/AppError";
import { IUpdateQuestionUseCase } from "./interfaces";

@injectable()
export class UpdateQuestion implements IUpdateQuestionUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string, cardId: string, question: string) {
    const card = await this.recallRepository.findByIdAndUserId(cardId, userId);
    if (!card) {
      throw new AppError("Recall card not found", 404);
    }

    card.question = question;
    await this.recallRepository.save(card);
    return card;
  }
}
