import "reflect-metadata";
import { container } from "tsyringe";
import { MongoUserRepository } from "../infrastructure/auth/repositories/MongoUserRepository";
import { MongooseUnitOfWork } from "../infrastructure/shared/MongooseUnitOfWork";

import { MongoFolderRepository } from "../infrastructure/folder/repositories/MongoFolderRepository";
import { AuthService } from "../infrastructure/auth/services/AuthService";
import { MongoChatRepository } from "../infrastructure/chat/repositories/MongoChatRepository";
import { QdrantVectorRepository } from "../infrastructure/vector/repositories/QdrantVectorRepository";
import { RedisOTPService } from "../infrastructure/auth/services/RedisOTPService";
import { NodemailerEmailService } from "../infrastructure/shared/services/NodemailerEmailService";
import { redisConnection } from "./redis";
import { RedisCacheService } from "../infrastructure/cache/RedisCacheService";
import { RegisterUser } from "../application/auth/use-cases/RegisterUser";
import { LoginUser } from "../application/auth/use-cases/LoginUser";
import { RefreshTokenUser } from "../application/auth/use-cases/RefreshTokenUser";
import { LogoutUser } from "../application/auth/use-cases/LogoutUser";
import { GetMe } from "../application/auth/use-cases/GetMe";
import { UpdateFcmToken } from "../application/auth/use-cases/UpdateFcmToken";
import { SendOTP } from "../application/auth/use-cases/SendOTP";
import { VerifyOTP } from "../application/auth/use-cases/VerifyOTP";
import { GoogleLogin } from "../application/auth/use-cases/GoogleLogin";
import { AdminLoginUseCase } from "../application/admin/adminAuth/usecases/adminLoginUsecase";
import { AdminLogoutUseCase } from "../application/admin/adminAuth/usecases/AdminLogout";
import { AdminGetMeUseCase } from "../application/admin/adminAuth/usecases/AdminGetMe";
import { AdminRefreshUseCase } from "../application/admin/adminAuth/usecases/AdminRefresh";
import { FindAllUser } from "../application/admin/user/usecases/findAllUser";
import { GetUserDetails } from "../application/admin/user/usecases/GetUserDetails";
import { SuspendUser } from "../application/admin/user/usecases/suspendUser";
import { UnsuspendUser } from "../application/admin/user/usecases/unsuspendUser";
import { ToggleBanUser } from "../application/admin/user/usecases/toggleBanUser";

container.registerInstance("RedisClient", redisConnection);
container.registerSingleton("ICacheService", RedisCacheService);

container.registerSingleton("IUserRepository", MongoUserRepository);
container.registerSingleton("IUnitOfWorkRepository", MongooseUnitOfWork);
container.registerSingleton("IFolderRepository", MongoFolderRepository);
container.registerSingleton("IAuthService", AuthService);
container.registerSingleton("IChatRepository", MongoChatRepository);
container.registerSingleton("IVectorRepository", QdrantVectorRepository);
container.registerSingleton("IOTPService", RedisOTPService);
container.registerSingleton("IEmailService", NodemailerEmailService);

container.registerSingleton("IRegisterUserUseCase", RegisterUser);
container.registerSingleton("ILoginUserUseCase", LoginUser);
container.registerSingleton("IRefreshTokenUserUseCase", RefreshTokenUser);
container.registerSingleton("ILogoutUserUseCase", LogoutUser);
container.registerSingleton("IGetMeUseCase", GetMe);
container.registerSingleton("IUpdateFcmTokenUseCase", UpdateFcmToken);
container.registerSingleton("ISendOtpUseCase", SendOTP);
container.registerSingleton("IVerifyOtpUseCase", VerifyOTP);
container.registerSingleton("IGoogleLoginUseCase", GoogleLogin);

container.registerSingleton("IAdminLoginUseCase", AdminLoginUseCase);
container.registerSingleton("IAdminLogoutUseCase", AdminLogoutUseCase);
container.registerSingleton("IAdminGetMeUseCase", AdminGetMeUseCase);
container.registerSingleton("IAdminRefreshUseCase", AdminRefreshUseCase);

container.registerSingleton("IFindAllUserUseCase", FindAllUser);
container.registerSingleton("IGetUserDetailsUseCase", GetUserDetails);
container.registerSingleton("ISuspendUserUseCase", SuspendUser);
container.registerSingleton("IUnsuspendUserUseCase", UnsuspendUser);
container.registerSingleton("IToggleBanUserUseCase", ToggleBanUser);

//admin


