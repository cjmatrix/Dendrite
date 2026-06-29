import { injectable, inject } from "tsyringe";
import { IFeedbackRepository } from "../../../domain/feedback/repositories/IFeedbackRepository";
import { ICreateFeedbackUseCase } from "./interfaces";

@injectable()
export class CreateFeedback implements ICreateFeedbackUseCase {
  constructor(
    @inject("IFeedbackRepository") private feedbackRepository: IFeedbackRepository
  ) {}

  async execute(userId: string, content: string, rating?: number) {
    return this.feedbackRepository.create({
      userId,
      content,
      rating,
      status: "new"
    });
  }
}
