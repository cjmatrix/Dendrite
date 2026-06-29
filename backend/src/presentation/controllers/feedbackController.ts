import { Request, Response } from "express";
import { BaseController } from "./base/BaseController";
import { injectable, inject, container } from "tsyringe";
import { ICreateFeedbackUseCase } from "../../application/feedback/use-cases/interfaces";
import { HttpStatus } from "../constants/httpStatus";

@injectable()
export class FeedbackController extends BaseController {
  constructor(
    @inject("ICreateFeedbackUseCase") private createFeedbackUseCase: ICreateFeedbackUseCase
  ) {
    super();
  }

  public createFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const { content, rating } = req.body;

      const result = await this.createFeedbackUseCase.execute(userId, content, rating);
      this.sendSuccess(res, result, HttpStatus.CREATED, "Feedback submitted successfully");
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const feedbackController = container.resolve(FeedbackController);
