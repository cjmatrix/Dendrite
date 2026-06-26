import { inject, injectable } from "tsyringe";
import { ITransactionRepository } from "../../../../domain/billing/repositories/ITransactionRepository";
import { AppError } from "../../../../utils/AppError";

export interface SubscriptionStatsFilterDTO {
  timeframe: "7days" | "30days" | "12months" | "custom";
  startDate?: string;
  endDate?: string;
  tier?: string;
}

@injectable()
export class GetSubscriptionStats {
  constructor(
    @inject("ITransactionRepository") private transactionRepo: ITransactionRepository
  ) {}

  async execute(filter: SubscriptionStatsFilterDTO) {
    let start: Date;
    let end: Date = new Date();
    let groupByFormat: string = "%Y-%m-%d";

    const timeframe = filter.timeframe || "30days";

    if (timeframe === "7days") {
      start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === "30days") {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === "12months") {
      start = new Date();
      start.setMonth(start.getMonth() - 12);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      groupByFormat = "%Y-%m";
    } else if (timeframe === "custom") {
      if (!filter.startDate || !filter.endDate) {
        throw new AppError("startDate and endDate are required for custom timeframe", 400);
      }
      start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);

      const diffMs = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 90) {
        groupByFormat = "%Y-%m";
      }
    } else {
      start = new Date();
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    }

    const chartData = await this.transactionRepo.aggregateSubscriptionStats(start, end, groupByFormat, filter.tier);

    const totalTransactions = chartData.reduce((acc, cur) => acc + cur.count, 0);
    const totalRevenue = chartData.reduce((acc, cur) => acc + cur.revenue, 0);

    return {
      timeframe,
      totalTransactions,
      totalRevenue,
      chartData
    };
  }
}
