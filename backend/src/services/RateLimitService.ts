import { injectable, inject } from "tsyringe";
import {
  UserTier,
  CountLimitCategory,
  DAILY_COUNT_LIMITS,
  MODEL_TOKEN_LIMITS,
  DEFAULT_MODEL_TOKEN_LIMITS,
  CountLimits,
  UPLOAD_SIZE_LIMITS,
} from "../constants/rateLimits";
import { ICacheService } from "../application/common/ports/ICacheService";
import { IRateLimitService, RateLimitCheckResult, UserUsageSummary } from "../application/common/ports/IRateLimitService";
import { MongoRateLimit } from "../infrastructure/auth/models/MongoRateLimitModel";

@injectable()
export class RateLimitService implements IRateLimitService {
  constructor(
    @inject("ICacheService") private cacheService: ICacheService,
  ) {}

  private countKey(userId: string, category: CountLimitCategory): string {
    return `ratelimit:${userId}:${category}`;
  }

  private tokenKey(userId: string, modelId: string): string {
    return `ratelimit:${userId}:tokens:${modelId}`;
  }

  private secondsUntilMidnightUTC(): number {
    const now = new Date();
    const midnight = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1, 
        0,
        0,
        0,
        0,
      ),
    );
    return Math.max(1, Math.floor((midnight.getTime() - now.getTime()) / 1000));
  }

  async checkCountLimit(
    userId: string,
    tier: UserTier,
    category: CountLimitCategory,
  ): Promise<RateLimitCheckResult> {
    const dailyCountLimits = await this.getDailyCountLimits();
    const limit =
      dailyCountLimits[tier]?.[category] ?? dailyCountLimits.free[category];

    if (limit === -1) {
      return { allowed: true, current: 0, limit: -1, resetsInSeconds: 0 };
    }

    const key = this.countKey(userId, category);
    const currentStr = await this.cacheService.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const resetsInSeconds = this.secondsUntilMidnightUTC();

    return {
      allowed: current < limit,
      current,
      limit,
      resetsInSeconds,
    };
  }

  async incrementCount(
    userId: string,
    category: CountLimitCategory,
    amount: number = 1,
  ): Promise<number> {
    const key = this.countKey(userId, category);
    const currentStr = await this.cacheService.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const newValue = current + amount;
    await this.cacheService.set(key, newValue.toString(), { EX: this.secondsUntilMidnightUTC() });
    return newValue;
  }

  async checkTokenLimit(
    userId: string,
    tier: UserTier,
    modelId: string,
  ): Promise<RateLimitCheckResult> {
    const modelTokenLimits = await this.getModelTokenLimits();
    const defaultModelTokenLimits = await this.getDefaultModelTokenLimits();
    const modelLimits = modelTokenLimits[modelId];
    const limit = modelLimits
      ? (modelLimits[tier] ?? defaultModelTokenLimits[tier])
      : defaultModelTokenLimits[tier];

    if (limit === -1) {
      return { allowed: true, current: 0, limit: -1, resetsInSeconds: 0 };
    }

    if (limit === 0) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        resetsInSeconds: this.secondsUntilMidnightUTC(),
      };
    }

    const key = this.tokenKey(userId, modelId);
    const currentStr = await this.cacheService.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const resetsInSeconds = this.secondsUntilMidnightUTC();

    return {
      allowed: current < limit,
      current,
      limit,
      resetsInSeconds,
    };
  }

  async incrementTokens(
    userId: string,
    modelId: string,
    tokens: number,
  ): Promise<number> {
    const key = this.tokenKey(userId, modelId);
    const currentStr = await this.cacheService.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const newValue = current + tokens;
    await this.cacheService.set(key, newValue.toString(), { EX: this.secondsUntilMidnightUTC() });
    return newValue;
  }

  async getUserUsageSummary(
    userId: string,
    tier: UserTier,
  ): Promise<UserUsageSummary> {
    const categories: CountLimitCategory[] = [
      "mainQueries",
      "quickChats",
      "recallCards",
      "p5Visualizations",
      "documentUploads",
      "agentWorkspaces",
      "imageUploads",
    ];

    const models = [
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "openai/gpt-5.5",
      "openai/gpt-5.4",
      "anthropic/claude-opus-4.8",
      "anthropic/claude-sonnet-4.6",
      "moonshotai/kimi-k2.6:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "groq/llama-3.3-70b-versatile",
      "groq/openai/gpt-oss-120b",
    ];

        const pipeline = this.cacheService.pipeline();
    for (const cat of categories) {
      pipeline.get(this.countKey(userId, cat));
    }
    for (const model of models) {
      pipeline.get(this.tokenKey(userId, model));
    }
    const results = await pipeline.exec();

    const countResults = results.slice(0, categories.length) as (string | null)[];
    const tokenResults = results.slice(categories.length) as (string | null)[];

    const dailyCountLimits = await this.getDailyCountLimits();
    const modelTokenLimits = await this.getModelTokenLimits();
    const defaultModelTokenLimits = await this.getDefaultModelTokenLimits();

    const counts: Record<string, { current: number; limit: number }> = {};
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const limit =
        dailyCountLimits[tier]?.[cat] ?? dailyCountLimits.free[cat];
      const val = countResults[i];
      counts[cat] = {
        current: val ? parseInt(val, 10) : 0,
        limit,
      };
    }

    const tokens: Record<string, { current: number; limit: number }> = {};
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const limitConfig = modelTokenLimits[model];
      const limit = limitConfig
        ? (limitConfig[tier] ?? defaultModelTokenLimits[tier])
        : defaultModelTokenLimits[tier];
      
      const val = tokenResults[i];
      const current = val ? parseInt(val, 10) : 0;
      tokens[model] = {
        current: limit === -1 ? 0 : current,
        limit,
      };
    }

    return {
      counts: counts as Record<
        CountLimitCategory,
        { current: number; limit: number }
      >,
      tokens,
      resetsInSeconds: this.secondsUntilMidnightUTC(),
    };
  }

  private async getDailyCountLimits(): Promise<Record<UserTier, CountLimits>> {
    const cacheKey = "config:daily_count_limits";
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error("Redis error fetching daily count limits config:", err);
    }

    try {
      const dbDoc = await MongoRateLimit.findOne({ key: "daily_count_limits" }).lean();
      if (dbDoc && dbDoc.value) {
        await this.cacheService.set(cacheKey, JSON.stringify(dbDoc.value));
        return dbDoc.value as Record<UserTier, CountLimits>;
      }
    } catch (err) {
      console.error("MongoDB error fetching daily count limits config:", err);
    }

    return DAILY_COUNT_LIMITS;
  }

  private async getModelTokenLimits(): Promise<Record<string, Record<UserTier, number>>> {
    const cacheKey = "config:model_token_limits";
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error("Redis error fetching model token limits config:", err);
    }

    try {
      const dbDoc = await MongoRateLimit.findOne({ key: "model_token_limits" }).lean();
      if (dbDoc && dbDoc.value) {
        await this.cacheService.set(cacheKey, JSON.stringify(dbDoc.value));
        return dbDoc.value as Record<string, Record<UserTier, number>>;
      }
    } catch (err) {
      console.error("MongoDB error fetching model token limits config:", err);
    }

    return MODEL_TOKEN_LIMITS;
  }

  private async getDefaultModelTokenLimits(): Promise<Record<UserTier, number>> {
    const cacheKey = "config:default_model_token_limits";
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error("Redis error fetching default model token limits config:", err);
    }

    try {
      const dbDoc = await MongoRateLimit.findOne({ key: "default_model_token_limits" }).lean();
      if (dbDoc && dbDoc.value) {
        await this.cacheService.set(cacheKey, JSON.stringify(dbDoc.value));
        return dbDoc.value as Record<UserTier, number>;
      }
    } catch (err) {
      console.error("MongoDB error fetching default model token limits config:", err);
    }

    return DEFAULT_MODEL_TOKEN_LIMITS;
  }

  async resetUserLimits(userId: string): Promise<void> {
    const categories: CountLimitCategory[] = [
      "mainQueries",
      "quickChats",
      "recallCards",
      "p5Visualizations",
      "documentUploads",
      "agentWorkspaces",
      "imageUploads",
    ];

    const models = [
      "gemini-3-flash-preview",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-2.5-flash",
      "openai/gpt-5.5",
      "openai/gpt-5.4",
      "anthropic/claude-opus-4.8",
      "anthropic/claude-sonnet-4.6",
      "moonshotai/kimi-k2.6:free",
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "groq/llama-3.3-70b-versatile",
      "groq/openai/gpt-oss-120b",
    ];

    const keysToDelete: string[] = [];
    for (const cat of categories) {
      keysToDelete.push(this.countKey(userId, cat));
    }
    for (const model of models) {
      keysToDelete.push(this.tokenKey(userId, model));
    }

    const pipeline = this.cacheService.pipeline();
    for (const key of keysToDelete) {
      pipeline.del(key);
    }
    await pipeline.exec();
  }

  async getUploadSizeLimits(): Promise<Record<UserTier, { document: number; image: number }>> {
    const cacheKey = "config:upload_size_limits";
    try {
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      console.error("Redis error fetching upload size limits config:", err);
    }

    try {
      const dbDoc = await MongoRateLimit.findOne({ key: "upload_size_limits" }).lean();
      if (dbDoc && dbDoc.value) {
        await this.cacheService.set(cacheKey, JSON.stringify(dbDoc.value));
        return dbDoc.value as Record<UserTier, { document: number; image: number }>;
      }
    } catch (err) {
      console.error("MongoDB error fetching upload size limits config:", err);
    }

    return UPLOAD_SIZE_LIMITS;
  }
}
