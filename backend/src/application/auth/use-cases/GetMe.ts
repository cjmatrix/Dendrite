import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../utils/AppError";
import { IUser } from "../../../domain/auth/entities/User";
import { injectable, inject } from "tsyringe";

@injectable()
export class GetMe {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<IUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
}
