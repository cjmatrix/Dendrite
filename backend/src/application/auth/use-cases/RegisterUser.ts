import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { IAuthService } from "../../../domain/auth/services/IAuthService";
import { AppError } from "../../../utils/AppError";
import { RegisterInputDTO } from "../dtos/auth.dto";
import { IUser } from "../../../domain/auth/entities/User";

import { injectable, inject } from "tsyringe";
import { IUnitOfWorkRepository } from "../../../domain/shared/IUnitOfWorkRepository";

@injectable()
export class RegisterUser {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IFolderRepository") private folderRepository: IFolderRepository,
    @inject("IUnitOfWorkRepository")
    private unitOfWorkRepository: IUnitOfWorkRepository,
    @inject("IAuthService") private authService: IAuthService,
  ) {}

  async execute(userData: RegisterInputDTO): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const { name, email, password } = userData;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("User already exists", 409);
    }

    return await this.unitOfWorkRepository.runInTransaction(async () => {
      const user = await this.userRepository.create({
        name,
        email,
        password,
      });
      
      await this.userRepository.save(user);

      const systemFolders = [
        {
          userId: user._id,
          parentId: null,
          name: "Documents",
          isSystemFolder: true,
        },
        {
          userId: user._id,
          parentId: null,
          name: "Media",
          isSystemFolder: true,
        },
        {
          userId: user._id,
          parentId: null,
          name: "Research",
          isSystemFolder: true,
        },
        {
          userId: user._id,
          parentId: null,
          name: "Chats",
          isSystemFolder: true,
        },
      ];

      await this.folderRepository.insertMany(systemFolders);

      const accessToken = this.authService.generateAccessToken(user._id.toString());
      const refreshToken = this.authService.generateRefreshToken(user._id.toString());

      user.refreshTokens.push(refreshToken);
      await this.userRepository.save(user);

      return { user, accessToken, refreshToken };
    });
  }
}
