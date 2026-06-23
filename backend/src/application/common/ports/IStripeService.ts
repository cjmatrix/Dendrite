export interface IStripeService {
  createCheckoutSession(userId: string, email: string, tier: string, billingCycle: "monthly" | "yearly"): Promise<string>;
  createPortalSession(customerId: string): Promise<string>;
  handleWebhookEvent(body: Buffer, signature: string): Promise<void>;
}
