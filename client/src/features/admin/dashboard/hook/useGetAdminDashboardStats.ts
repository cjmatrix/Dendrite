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

export function useGetAdminDashboardStats() {
  return useQuery<AdminDashboardStats>({
    queryKey: ["admin", "dashboard", "stats"],
    queryFn: async () => {
      const response = await api.get("/admin/dashboard/stats");
      return response.data.data;
    },
    refetchInterval: 15000, 
  });
}
