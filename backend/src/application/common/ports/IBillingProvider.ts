export interface IBillingProvider {
  createCheckoutSession(userId: string, email: string, tier: string, billingCycle: "monthly" | "yearly"): Promise<string>;
  createPortalSession(customerId: string): Promise<string>;
  handleWebhookEvent(body: Buffer | string, signature: string): Promise<void>;
}
