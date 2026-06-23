import { inject, injectable } from "tsyringe";
import { IBillingProvider } from "../../common/ports/IBillingProvider";
import { ICreateCheckoutSessionUseCase } from "./interfaces";

@injectable()
export class CreateCheckoutSession implements ICreateCheckoutSessionUseCase {
  constructor(
    @inject("IBillingProvider") private billingProvider: IBillingProvider
  ) {}

  async execute(userId: string, email: string, tier: string, billingCycle: "monthly" | "yearly"): Promise<string> {
    return await this.billingProvider.createCheckoutSession(userId, email, tier, billingCycle);
  }
}
