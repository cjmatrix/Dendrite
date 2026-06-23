import { UserTier, CountLimitCategory } from "../../../constants/rateLimits";

export interface RateLimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number;
  resetsInSeconds: number;
}

export interface UserUsageSummary {
  counts: Record<CountLimitCategory, { current: number; limit: number }>;
  tokens: Record<string, { current: number; limit: number }>;
  resetsInSeconds: number;
}

export interface IRateLimitService {
  checkCountLimit(
    userId: string,
    tier: UserTier,
    category: CountLimitCategory
  ): Promise<RateLimitCheckResult>;

  incrementCount(
    userId: string,
    category: CountLimitCategory,
    amount?: number
  ): Promise<number>;

  checkTokenLimit(
    userId: string,
    tier: UserTier,
    modelId: string
  ): Promise<RateLimitCheckResult>;

  incrementTokens(
    userId: string,
    modelId: string,
    tokens: number
  ): Promise<number>;

  getUserUsageSummary(
    userId: string,
    tier: UserTier
  ): Promise<UserUsageSummary>;

  resetUserLimits(userId: string): Promise<void>;
}
