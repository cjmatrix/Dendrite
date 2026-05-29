import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../../utils/AppError";
import { IToggleBanUserUseCase } from "./interfaces";

@injectable()
export class ToggleBanUser implements IToggleBanUserUseCase {
  constructor(
    @inject("IUserRepository") private userRepo: IUserRepository
  ) {}

  async execute(userId: string): Promise<string> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const newStatus = user.status === "banned" ? "active" : "banned";
    
    await this.userRepo.findByIdAndUpdate(userId, {
      status: newStatus,
    });

    return newStatus;
  }
}
