import { Request, Response } from "express";
import { BaseController } from "../base/BaseController";
import { injectable, inject, container } from "tsyringe";
import { IGetAllFeedbackUseCase, IUpdateFeedbackStatusUseCase } from "../../../application/feedback/use-cases/interfaces";
import { HttpStatus } from "../../constants/httpStatus";

@injectable()
export class AdminFeedbackController extends BaseController {
  constructor(
    @inject("IGetAllFeedbackUseCase") private getAllFeedbackUseCase: IGetAllFeedbackUseCase,
    @inject("IUpdateFeedbackStatusUseCase") private updateFeedbackStatusUseCase: IUpdateFeedbackStatusUseCase
  ) {
    super();
  }

  public getAllFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const feedbacks = await this.getAllFeedbackUseCase.execute();
      this.sendSuccess(res, feedbacks);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const feedbackId = this.getRouteParam(req, "id");
      const { status } = req.body;

      const result = await this.updateFeedbackStatusUseCase.execute(feedbackId, status);
      if (!result) {
        this.sendError(res, new Error("Feedback not found"));
        return;
      }
      
      this.sendSuccess(res, result, HttpStatus.OK, "Feedback status updated");
    } catch (error) {
      this.sendError(res, error);
    }
  };
}

export const adminFeedbackController = container.resolve(AdminFeedbackController);
