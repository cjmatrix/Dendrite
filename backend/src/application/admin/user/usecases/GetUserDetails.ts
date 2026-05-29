import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../../utils/AppError";
import { IGetUserDetailsUseCase } from "./interfaces";

@injectable()
export class GetUserDetails implements IGetUserDetailsUseCase {
  constructor(@inject("IUserRepository") private userRepo: IUserRepository) {}

  async execute(userId: string) {
    const user = await this.userRepo.findByIdSafe(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
