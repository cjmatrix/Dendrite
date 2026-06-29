import { injectable, inject } from "tsyringe";
import { IFeedbackRepository } from "../../../domain/feedback/repositories/IFeedbackRepository";
import { IGetAllFeedbackUseCase } from "./interfaces";

@injectable()
export class GetAllFeedback implements IGetAllFeedbackUseCase {
  constructor(
    @inject("IFeedbackRepository") private feedbackRepository: IFeedbackRepository
  ) {}

  async execute() {
    return this.feedbackRepository.findAll();
  }
}
