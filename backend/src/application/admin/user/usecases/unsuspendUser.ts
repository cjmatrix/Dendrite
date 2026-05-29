import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { ICacheService } from "../../../common/ports/ICacheService";
import { AppError } from "../../../../utils/AppError";
import { IUnsuspendUserUseCase } from "./interfaces";

@injectable()
export class UnsuspendUser implements IUnsuspendUserUseCase {
  constructor(
    @inject("IUserRepository") private userRepo: IUserRepository,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    await this.userRepo.findByIdAndUpdate(userId, {
      status: "active",
    });

    const redisKey = `suspend:${userId}`;
    await this.cacheService.del(redisKey);
  }
}
