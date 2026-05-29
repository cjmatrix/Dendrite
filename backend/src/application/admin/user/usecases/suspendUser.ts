import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { ICacheService } from "../../../common/ports/ICacheService";
import { AppError } from "../../../../utils/AppError";


@injectable()
export class SuspendUser {
  constructor(
    @inject("IUserRepository") private userRepo: IUserRepository,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(userId: string, durationInSeconds: number): Promise<void> {
    const user = await this.userRepo.findById(userId);
   
    if (!user) {
      throw new AppError("User not found", 404);
    }

   
    await this.userRepo.findByIdAndUpdate(userId, {
      status: "suspended",
    });
    const redisKey = `suspend:${userId}`;
   
    await this.cacheService.set(redisKey, "true", { EX:durationInSeconds});
  }
}
