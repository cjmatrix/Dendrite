import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { IBillingProvider } from "../../../application/common/ports/IBillingProvider";
import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { ITransactionRepository } from "../../../domain/billing/repositories/ITransactionRepository";

@injectable()
export class PaddleService implements IBillingProvider {
  private paddle: Paddle;
  private endpointSecret: string;
  private clientUrl: string;

  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("ITransactionRepository") private transactionRepository: ITransactionRepository,
  ) {
    this.paddle = new Paddle(process.env.PADDLE_API_KEY || "mock_api_key", {
      environment:Environment.sandbox,
    });
    this.endpointSecret =
      process.env.PADDLE_WEBHOOK_SECRET || "mock_webhook_secret";
    this.clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  }

  private getPriceId(tier: string, billingCycle: "monthly" | "yearly"): string {
    const priceMap: Record<string, Record<"monthly" | "yearly", string>> = {
      pro: {
        monthly: process.env.PADDLE_PRICE_PRO_MONTHLY || "pri_mock_pro_monthly",
        yearly: process.env.PADDLE_PRICE_PRO_YEARLY || "pri_mock_pro_yearly",
      },
      byok: {
        monthly:
          process.env.PADDLE_PRICE_BYOK_MONTHLY || "pri_mock_byok_monthly",
        yearly: process.env.PADDLE_PRICE_BYOK_YEARLY || "pri_mock_byok_yearly",
      },
      enterprise: {
        monthly:
          process.env.PADDLE_PRICE_ENTERPRISE_MONTHLY || "pri_mock_ent_monthly",
        yearly:
          process.env.PADDLE_PRICE_ENTERPRISE_YEARLY || "pri_mock_ent_yearly",
      },
    };
    return priceMap[tier.toLowerCase()]?.[billingCycle] || "";
  }

  async createCheckoutSession(
    userId: string,
    email: string,
    tier: string,
    billingCycle: "monthly" | "yearly",
  ): Promise<string> {
    const priceId = this.getPriceId(tier, billingCycle);
    if (!priceId) {
      throw new Error(`Invalid plan selected: ${tier}`);
    }

    const transaction = await this.paddle.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: {
        userId,
        tier,
      },
    });

    if (!transaction.checkout?.url) {
      throw new Error("Failed to generate checkout url");
    }

    return transaction.checkout.url;
  }

  async createPortalSession(customerId: string): Promise<string> {
 
    try {
      const portalSession = await this.paddle.customerPortalSessions.create(
        customerId,
        [],
      );
   
      return (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (portalSession.urls as any).general?.overview ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (portalSession.urls as any).general?.subscriptions ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (portalSession.urls as any).generalSetting ||
        ""
      );
    } catch (err: unknown) {
      console.error(" Error in createPortalSession SDK call:", err);
      throw err;
    }
  }

  async handleWebhookEvent(
    body: Buffer | string,
    signature: string,
  ): Promise<void> {
    try {
      console.log("WEB HOOK COMING")
      const eventData = await this.paddle.webhooks.unmarshal(
        body.toString(),
        this.endpointSecret,
        signature,
      );
      if (!eventData) return;

      switch (eventData.eventType) {
        case "transaction.completed": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transaction = eventData.data as any;
        const userId = transaction.customData?.userId;
        
        if (userId) {
         
          await this.userRepository.findByIdAndUpdate(userId, {
            billingCustomerId: transaction.customerId,
            billingSubscriptionId: transaction.subscriptionId,
            billingProvider: "paddle",
            tier: transaction.customData?.tier,
          });

          try {
            const amount = parseFloat(transaction.details?.totals?.total || "0") / 100;
            const currency = transaction.details?.totals?.currencyCode || "USD";

            await this.transactionRepository.create({
              userId,
              transactionId: transaction.id,
              customerId: transaction.customerId,
              subscriptionId: transaction.subscriptionId,
              amount,
              currency,
              tier: transaction.customData?.tier || "pro",
              status: "completed",
            });
          } catch (ledgerErr) {
            console.error("Failed to log transaction to ledger:", ledgerErr);
          }
        }
        break;
        }
        case "subscription.updated":
        case "subscription.canceled": {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscription = eventData.data as any;
        const isActive = ["active", "trialing"].includes(subscription.status);

      
        const updatePayload: Record<string, unknown> = {
          billingSubscriptionId: isActive ? subscription.id : null,
        };

        if (!isActive) {
          updatePayload.tier = "free";
        }

       
        await this.userRepository.updateByBillingCustomerId(
          subscription.customerId, 
          updatePayload
        );
        break;
      }
      }
    } catch (err: unknown) {
      throw new Error(`Webhook Error: ${(err as Error).message}`);
    }
  }
}
