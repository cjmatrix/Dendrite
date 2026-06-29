import { injectable, inject } from "tsyringe";
import { IFeedbackRepository } from "../../../domain/feedback/repositories/IFeedbackRepository";
import { IUpdateFeedbackStatusUseCase } from "./interfaces";

@injectable()
export class UpdateFeedbackStatus implements IUpdateFeedbackStatusUseCase {
  constructor(
    @inject("IFeedbackRepository") private feedbackRepository: IFeedbackRepository
  ) {}

  async execute(id: string, status: 'new' | 'reviewed' | 'resolved') {
    return this.feedbackRepository.updateStatus(id, status);
  }
}
