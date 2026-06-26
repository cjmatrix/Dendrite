import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { BaseController } from "./base/BaseController";
import {
  ICreateCheckoutSessionUseCase,
  ICreatePortalSessionUseCase,
  IHandleWebhookUseCase,
} from "../../application/billing/use-cases/interfaces";
import { container } from "tsyringe";
import { HttpStatus } from "../constants/httpStatus";
import { BILLING_MESSAGES } from "../constants/billingMessages";

@injectable()
export class BillingController extends BaseController {
  constructor(
    @inject("ICreateCheckoutSessionUseCase") private createCheckoutSessionUseCase: ICreateCheckoutSessionUseCase,
    @inject("ICreatePortalSessionUseCase") private createPortalSessionUseCase: ICreatePortalSessionUseCase,
    @inject("IHandleWebhookUseCase") private handleWebhookUseCase: IHandleWebhookUseCase
  ) {
    super();
  }

  public createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const email = req.user?.email;
      if (!email) throw new Error(BILLING_MESSAGES.EMAIL_REQUIRED);
      
      const { tier, billingCycle } = req.body;
      const url = await this.createCheckoutSessionUseCase.execute(userId, email, tier, billingCycle);
      
      this.sendSuccess(res, { url }, HttpStatus.OK, BILLING_MESSAGES.CHECKOUT_SESSION_CREATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public createPortalSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const url = await this.createPortalSessionUseCase.execute(userId);
      this.sendSuccess(res, { url }, HttpStatus.OK, BILLING_MESSAGES.PORTAL_SESSION_CREATED);
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers["paddle-signature"] as string;
      await this.handleWebhookUseCase.execute(req.body, signature);
      res.status(HttpStatus.OK).send(BILLING_MESSAGES.WEBHOOK_RECEIVED);
    } catch (error: unknown) {
      console.error("Webhook Error:", (error as Error).message);
      res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${(error as Error).message}`);
    }
  };
}

export const billingController = container.resolve(BillingController);
