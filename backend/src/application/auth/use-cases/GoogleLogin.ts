import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { IAuthService } from "../../../domain/auth/services/IAuthService";
import { ICacheService } from "../../../application/common/ports/ICacheService";
import { IUnitOfWorkRepository } from "../../common/ports/IUnitOfWorkRepository";
import { AppError } from "../../../utils/AppError";
import { AuthMapper, AuthOutputDTO } from "../dtos/auth.dto";
import { OAuth2Client } from "google-auth-library";
import { v4 as uuidv4 } from "uuid";
import { injectable, inject } from "tsyringe";
import { IGoogleLoginUseCase } from "./interfaces";

@injectable()
export class GoogleLogin implements IGoogleLoginUseCase {
  private googleClient: OAuth2Client;

  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IFolderRepository") private folderRepository: IFolderRepository,
    @inject("IAuthService") private authService: IAuthService,
    @inject("ICacheService") private cacheService: ICacheService,
    @inject("IUnitOfWorkRepository")
    private unitOfWorkRepository: IUnitOfWorkRepository,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async execute(
    idToken: string,
  ): Promise<AuthOutputDTO> {
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      throw new AppError("Failed to verify Google token: " + err.message, 400);
    }

    if (!payload || !payload.email) {
      throw new AppError("Invalid Google token payload", 400);
    }

    const { email, name, picture } = payload;

    let user = await this.userRepository.findByEmail(email);

    if (user) {
      if (user.status === "banned") {
        throw new AppError("Your account has been Banned.", 403);
      }
      if (user.status === "suspended") {
        throw new AppError("Your account has been suspended.", 403);
      }
    } else {
      user = await this.unitOfWorkRepository.runInTransaction(async () => {
        const newUser = await this.userRepository.create({
          name: name || "Google User",
          email: email,
          password: uuidv4(),
          avatarUrl: picture || "",
          status: "active",
        });

        await this.userRepository.save(newUser);

        const systemFolders = [
          {
            userId: newUser._id,
            ownerId: newUser._id,
            parentId: null,
            name: "Documents",
            isSystemFolder: true,
          },
          {
            userId: newUser._id,
            ownerId: newUser._id,
            parentId: null,
            name: "Media",
            isSystemFolder: true,
          },
          {
            userId: newUser._id,
            ownerId: newUser._id,
            parentId: null,
            name: "Research",
            isSystemFolder: true,
          },
          {
            userId: newUser._id,
            ownerId: newUser._id,
            parentId: null,
            name: "Chats",
            isSystemFolder: true,
          },
        ];

        await this.folderRepository.insertMany(systemFolders);
        return newUser;
      });
    }

    const accessToken = this.authService.generateAccessToken(
      user._id.toString(),
    );
    const refreshToken = this.authService.generateRefreshToken(
      user._id.toString(),
    );

    await this.cacheService.set(
      `refresh_token:${refreshToken}`,
      user._id.toString(),
      { EX: 604800 },
    );

    return AuthMapper.toAuthOutput(user, accessToken, refreshToken);
  }
}

