import { inject, injectable } from "tsyringe";
import { IUpdateRateLimitUseCase } from "./interfaces";
import { IRateLimitRepository } from "../../../../domain/rateLimit/repositories/IRateLimitRepository";
import { ICacheService } from "../../../common/ports/ICacheService";
import { AppError } from "../../../../utils/AppError";

@injectable()
export class UpdateRateLimit implements IUpdateRateLimitUseCase {
  constructor(
    @inject("IRateLimitRepository") private rateLimitRepo: IRateLimitRepository,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(key: string, value: any): Promise<void> {
    const allowedKeys = ["daily_count_limits", "model_token_limits", "default_model_token_limits"];
    if (!allowedKeys.includes(key)) {
      throw new AppError("Invalid rate limit key", 400);
    }

    if (value === undefined || value === null) {
      throw new AppError("Rate limit value is required", 400);
    }

    await this.rateLimitRepo.upsert(key, value);

    // Invalidate the cache
    await this.cacheService.del(`config:${key}`);
  }
}
