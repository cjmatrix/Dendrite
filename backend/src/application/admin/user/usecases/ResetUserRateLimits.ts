import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { IRateLimitService } from "../../../../application/common/ports/IRateLimitService";
import { AppError } from "../../../../utils/AppError";
import { IResetUserRateLimitsUseCase } from "./interfaces";

@injectable()
export class ResetUserRateLimits implements IResetUserRateLimitsUseCase {
  constructor(
    @inject("IUserRepository") private userRepo: IUserRepository,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService,
  ) {}

  async execute(targetUserId: string): Promise<void> {
    const user = await this.userRepo.findByIdSafe(targetUserId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this.rateLimitService.resetUserLimits(targetUserId);
  }
}
