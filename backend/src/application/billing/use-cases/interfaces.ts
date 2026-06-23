export interface ICreateCheckoutSessionUseCase {
  execute(userId: string, email: string, tier: string, billingCycle: "monthly" | "yearly"): Promise<string>;
}

export interface ICreatePortalSessionUseCase {
  execute(userId: string): Promise<string>;
}

export interface IHandleWebhookUseCase {
  execute(body: Buffer | string, signature: string): Promise<void>;
}
