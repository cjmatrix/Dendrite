import { inject, injectable } from "tsyringe";
import { IUserRepository } from "../../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../../utils/AppError";
import { IGetUserDetailsUseCase } from "./interfaces";
import { UserManagementMapper, AdminUserDetailOutputDTO } from "../dtos/userManagement.dto";

@injectable()
export class GetUserDetails implements IGetUserDetailsUseCase {
  constructor(@inject("IUserRepository") private userRepo: IUserRepository) {}

  async execute(userId: string): Promise<AdminUserDetailOutputDTO> {
    const user = await this.userRepo.findByIdSafe(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return UserManagementMapper.toUserDetailOutput(user);
  }
}

