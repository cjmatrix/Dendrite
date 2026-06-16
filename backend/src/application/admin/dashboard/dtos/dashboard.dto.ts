export interface TokenCategoryStats {
  input: number;
  output: number;
  total: number;
}

export interface AdminDashboardStatsOutputDTO {
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
