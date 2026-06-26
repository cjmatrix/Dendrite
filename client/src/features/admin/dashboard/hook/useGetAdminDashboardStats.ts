import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";

export interface TokenCategoryStats {
  input: number;
  output: number;
  total: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  activeToday: number;
  activeNow: number;
  pendingApprovals: number;
  suspendedUsers: number;
  tokenUsage: {
    mainChat: TokenCategoryStats;
    chatSummary: TokenCategoryStats;
    codeDescription: TokenCategoryStats;
    p5Visualization: TokenCategoryStats;
    quickChat: TokenCategoryStats;
    totalTokens: number;
  };
}

export function useGetAdminDashboardStats(filter?: { 
  timeframe?: "24h" | "7d" | "30d" | "12m" | "custom" | "all"; 
  tier?: string;
  provider?: string;
  customStartDate?: string;
  customEndDate?: string;
}) {
  return useQuery<AdminDashboardStats>({
    queryKey: ["admin", "dashboard", "stats", filter?.timeframe, filter?.tier, filter?.provider, filter?.customStartDate, filter?.customEndDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter?.tier) params.append("tier", filter.tier);
      if (filter?.provider) params.append("provider", filter.provider);
      
      let start: Date | undefined;
      let end: Date | undefined;
      const tf = filter?.timeframe || "all";

      if (tf === "24h") {
        start = new Date(Date.now() - 24 * 60 * 60 * 1000);
        end = new Date();
      } else if (tf === "7d") {
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        end = new Date();
      } else if (tf === "30d") {
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        end = new Date();
      } else if (tf === "12m") {
        start = new Date();
        start.setMonth(start.getMonth() - 12);
        end = new Date();
      } else if (tf === "custom") {
        start = filter?.customStartDate ? new Date(filter.customStartDate) : undefined;
        end = filter?.customEndDate ? new Date(filter.customEndDate) : undefined;
      }

      if (start) params.append("startDate", start.toISOString());
      if (end) params.append("endDate", end.toISOString());
      
      const queryStr = params.toString() ? `?${params.toString()}` : "";
      
      const response = await api.get(`/admin/dashboard/stats${queryStr}`);
      return response.data.data;
    },
    refetchInterval: 15000, 
  });
}
