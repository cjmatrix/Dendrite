import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../utils/AppError";
import { AuthMapper, UserOutputDTO } from "../dtos/auth.dto";
import { injectable, inject } from "tsyringe";
import { IGetMeUseCase } from "./interfaces";

@injectable()
export class GetMe implements IGetMeUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<UserOutputDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return AuthMapper.toUserOutput(user);
  }
}

