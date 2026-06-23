import { injectable } from "tsyringe";
import mongoose from "mongoose";
import { ITransactionRepository } from "../../../domain/billing/repositories/ITransactionRepository";
import { ITransaction } from "../../../domain/billing/entities/Transaction";
import { MongoTransaction } from "../models/MongoTransactionModel";

@injectable()
export class MongoTransactionRepository implements ITransactionRepository {
  async create(transactionData: Partial<ITransaction>): Promise<ITransaction> {
    const doc = await MongoTransaction.create({
      ...transactionData,
      userId: new mongoose.Types.ObjectId(transactionData.userId),
    });
    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      transactionId: doc.transactionId,
      customerId: doc.customerId,
      subscriptionId: doc.subscriptionId,
      amount: doc.amount,
      currency: doc.currency,
      tier: doc.tier,
      status: doc.status,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async aggregateSubscriptionStats(
    start: Date,
    end: Date,
    groupByFormat: string
  ): Promise<{ date: string; count: number; revenue: number }[]> {
    const result = await MongoTransaction.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: "completed",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: groupByFormat, date: "$createdAt" },
          },
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return result.map((item) => ({
      date: item._id,
      count: item.count,
      revenue: item.amount,
    }));
  }
}
