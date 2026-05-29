import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../../utils/AppError";
import { IUser } from "../../../../domain/auth/entities/User";

@injectable()
export class AdminGetMeUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(adminId: string): Promise<IUser> {
    const user = await this.userRepository.findById(adminId);
    if (!user) {
      throw new AppError("Admin not found", 404);
    }

    if (user.role !== "admin") {
      throw new AppError("Access denied: Not an admin", 403);
    }

    return user;
  }
}
