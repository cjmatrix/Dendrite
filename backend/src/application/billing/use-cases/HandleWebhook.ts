import { inject, injectable } from "tsyringe";
import { IBillingProvider } from "../../common/ports/IBillingProvider";
import { IHandleWebhookUseCase } from "./interfaces";

@injectable()
export class HandleWebhook implements IHandleWebhookUseCase {
  constructor(
    @inject("IBillingProvider") private billingProvider: IBillingProvider
  ) {}

  async execute(body: Buffer | string, signature: string): Promise<void> {
    await this.billingProvider.handleWebhookEvent(body, signature);
  }
}
