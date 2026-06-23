import { inject, injectable } from "tsyringe";
import { IGetRateLimitsUseCase } from "./interfaces";
import { IRateLimitRepository } from "../../../../domain/rateLimit/repositories/IRateLimitRepository";
import { ICacheService } from "../../../common/ports/ICacheService";
import {
  MODEL_TOKEN_LIMITS,
  DEFAULT_MODEL_TOKEN_LIMITS,
  DAILY_COUNT_LIMITS,
} from "../../../../constants/rateLimits";

@injectable()
export class GetRateLimits implements IGetRateLimitsUseCase {
  constructor(
    @inject("IRateLimitRepository") private rateLimitRepo: IRateLimitRepository,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(): Promise<Record<string, any>> {
    const keys = ["daily_count_limits", "model_token_limits", "default_model_token_limits"];
    const limits: Record<string, any> = {};

    for (const key of keys) {
      const cacheKey = `config:${key}`;
      let value = null;

      try {
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
          value = JSON.parse(cached);
        }
      } catch (err) {
        console.error(`Redis error fetching ${key} config:`, err);
      }

      if (!value) {
        const doc = await this.rateLimitRepo.findByKey(key);
        if (doc && doc.value) {
          value = doc.value;
          await this.cacheService.set(cacheKey, JSON.stringify(value));
        } else {
          if (key === "daily_count_limits") value = DAILY_COUNT_LIMITS;
          if (key === "model_token_limits") value = MODEL_TOKEN_LIMITS;
          if (key === "default_model_token_limits") value = DEFAULT_MODEL_TOKEN_LIMITS;
        }
      }

      limits[key] = value;
    }

    return limits;
  }
}
