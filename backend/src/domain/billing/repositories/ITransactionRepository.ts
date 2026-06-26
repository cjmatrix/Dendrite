import { ITransaction } from "../entities/Transaction";

export interface ITransactionRepository {
  create(transactionData: Partial<ITransaction>): Promise<ITransaction>;
  aggregateSubscriptionStats(
    start: Date,
    end: Date,
    groupByFormat: string,
    tier?: string
  ): Promise<{ date: string; count: number; revenue: number }[]>;
}
