import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export interface SubscriptionStats {
  timeframe: string;
  totalTransactions: number;
  totalRevenue: number;
  chartData: Array<{
    date: string;
    count: number;
    revenue: number;
  }>;
}

export interface SubscriptionStatsFilter {
  timeframe: "24h" | "7d" | "30d" | "12m" | "custom" | "all";
  customStartDate?: string;
  customEndDate?: string;
  tier?: string;
}

export function useGetSubscriptionStats(filter: SubscriptionStatsFilter) {
  return useQuery<SubscriptionStats>({
    queryKey: ["subscriptionStats", filter.timeframe, filter.customStartDate, filter.customEndDate, filter.tier],
    queryFn: async () => {
      let start: Date;
      let end: Date = new Date();

      const tf = filter.timeframe;
      if (tf === "24h") {
        start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      } else if (tf === "7d") {
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      } else if (tf === "30d") {
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (tf === "12m") {
        start = new Date();
        start.setMonth(start.getMonth() - 12);
      } else if (tf === "all") {
        start = new Date(0);
      } else if (tf === "custom" && filter.customStartDate && filter.customEndDate) {
        start = new Date(filter.customStartDate);
        end = new Date(filter.customEndDate);
      } else {
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const response = await api.get("/admin/dashboard/subscription-stats", {
        params: {
          timeframe: "custom",
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          tier: filter.tier
        },
      });
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}
