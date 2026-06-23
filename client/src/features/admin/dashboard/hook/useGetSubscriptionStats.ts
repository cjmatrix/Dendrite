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
  timeframe: "7days" | "30days" | "12months" | "custom";
  startDate?: string;
  endDate?: string;
}

export function useGetSubscriptionStats(filter: SubscriptionStatsFilter) {
  return useQuery<SubscriptionStats>({
    queryKey: ["subscriptionStats", filter],
    queryFn: async () => {
      const response = await api.get("/admin/dashboard/subscription-stats", {
        params: filter,
      });
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });
}
