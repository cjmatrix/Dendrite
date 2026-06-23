import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";
import { BaseController } from "./base/BaseController";
import {
  ICreateCheckoutSessionUseCase,
  ICreatePortalSessionUseCase,
  IHandleWebhookUseCase,
} from "../../application/billing/use-cases/interfaces";
import { container } from "tsyringe";

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
      if (!email) throw new Error("Email is required for billing");
      
      const { tier, billingCycle } = req.body;
      const url = await this.createCheckoutSessionUseCase.execute(userId, email, tier, billingCycle);
      
      this.sendSuccess(res, { url }, 200, "Checkout session created");
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public createPortalSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = this.validateUserAuth(req);
      const url = await this.createPortalSessionUseCase.execute(userId);
      this.sendSuccess(res, { url }, 200, "Portal session created");
    } catch (error) {
      this.sendError(res, error);
    }
  };

  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const signature = req.headers["paddle-signature"] as string;
      await this.handleWebhookUseCase.execute(req.body, signature);
      res.status(200).send("Webhook received");
    } catch (error: any) {
      console.error("Webhook Error:", error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  };
}

export const billingController = container.resolve(BillingController);
