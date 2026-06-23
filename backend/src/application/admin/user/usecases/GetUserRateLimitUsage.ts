import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { IRateLimitService } from "../../../../application/common/ports/IRateLimitService";
import { AppError } from "../../../../utils/AppError";
import { IGetUserRateLimitUsageUseCase } from "./interfaces";
import { UserTier } from "../../../../constants/rateLimits";

@injectable()
export class GetUserRateLimitUsage implements IGetUserRateLimitUsageUseCase {
  constructor(
    @inject("IUserRepository") private userRepo: IUserRepository,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService,
  ) {}

  async execute(targetUserId: string): Promise<any> {
    const user = await this.userRepo.findByIdSafe(targetUserId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const tier = (user.tier || "free") as UserTier;
    const usage = await this.rateLimitService.getUserUsageSummary(targetUserId, tier);

    return {
      tier,
      counts: usage.counts,
      tokens: usage.tokens,
      resetsInSeconds: usage.resetsInSeconds
    };
  }
}
