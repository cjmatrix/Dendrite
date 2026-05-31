import "reflect-metadata";
import { container } from "tsyringe";
import { MongoUserRepository } from "../infrastructure/auth/repositories/MongoUserRepository";
import { MongooseUnitOfWork } from "../infrastructure/shared/MongooseUnitOfWork";

import { MongoFolderRepository } from "../infrastructure/folder/repositories/MongoFolderRepository";
import { MongoChatRepository } from "../infrastructure/chat/repositories/MongoChatRepository";
import { MongoMessageRepository } from "../infrastructure/chat/repositories/MongoMessageRepository";
import { MongoSubChatRepository } from "../infrastructure/chat/repositories/MongoSubChatRepository";
import { MongoCodeBlockRepository } from "../infrastructure/chat/repositories/MongoCodeBlockRepository";
import { MongoOutboxEventRepository } from "../infrastructure/outbox/repositories/MongoOutboxEventRepository";
import { AuthService } from "../infrastructure/auth/services/AuthService";
import { QdrantVectorRepository } from "../infrastructure/vector/repositories/QdrantVectorRepository";
import { MongoRecallRepository } from "../infrastructure/recall/repositories/MongoRecallRepository";
import { RedisOTPService } from "../infrastructure/auth/services/RedisOTPService";
import { BullMQEmbeddingPublisher } from "../infrastructure/shared/publishers/BullMQEmbeddingPublisher";
import { BullMQRecallPublisher } from "../infrastructure/shared/publishers/BullMQRecallPublisher";
import { BullMQDescriptionPublisher } from "../infrastructure/shared/publishers/BullMQDescriptionPublisher";
import { BullMQSummaryPublisher } from "../infrastructure/shared/publishers/BullMQSummaryPublisher";
import { BullMQStatePublisher } from "../infrastructure/shared/publishers/BullMQStatePublisher";
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

import { CreateChat } from "../application/chat/use-cases/CreateChat";
import { DeleteChat } from "../application/chat/use-cases/DeleteChat";
import { GetChatById } from "../application/chat/use-cases/GetChatById";
import { GetChatDocuments } from "../application/chat/use-cases/GetChatDocuments";
import { GetChatMessages } from "../application/chat/use-cases/GetChatMessages";
import { GetChats } from "../application/chat/use-cases/GetChats";
import { GetSubChat } from "../application/chat/use-cases/GetSubChat";
import { PrepareMessage } from "../application/chat/use-cases/PrepareMessage";
import { RemoveDocument } from "../application/chat/use-cases/RemoveDocument";
import { SaveModelReply } from "../application/chat/use-cases/SaveModelReply";
import { SaveSubChat } from "../application/chat/use-cases/SaveSubChat";
import { UpdateChat } from "../application/chat/use-cases/UpdateChat";
import { UploadChatImage } from "../application/chat/use-cases/UploadChatImage";

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
// Chat repositories
container.registerSingleton("IMessageRepository", MongoMessageRepository);
container.registerSingleton("ISubChatRepository", MongoSubChatRepository);
container.registerSingleton("ICodeBlockRepository", MongoCodeBlockRepository);
container.registerSingleton("IOutboxEventRepository", MongoOutboxEventRepository);
container.registerSingleton("IRecallRepository", MongoRecallRepository);

// Publishers
container.registerSingleton("IEmbeddingPublisher", BullMQEmbeddingPublisher);
container.registerSingleton("IRecallPublisher", BullMQRecallPublisher);
container.registerSingleton("IDescriptionPublisher", BullMQDescriptionPublisher);
container.registerSingleton("ISummaryPublisher", BullMQSummaryPublisher);
container.registerSingleton("IStatePublisher", BullMQStatePublisher);

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

container.registerSingleton("ICreateChatUseCase", CreateChat);
container.registerSingleton("IDeleteChatUseCase", DeleteChat);
container.registerSingleton("IGetChatByIdUseCase", GetChatById);
container.registerSingleton("IGetChatDocumentsUseCase", GetChatDocuments);
container.registerSingleton("IGetChatMessagesUseCase", GetChatMessages);
container.registerSingleton("IGetChatsUseCase", GetChats);
container.registerSingleton("IGetSubChatUseCase", GetSubChat);
container.registerSingleton("IPrepareMessageUseCase", PrepareMessage);
container.registerSingleton("IRemoveDocumentUseCase", RemoveDocument);
container.registerSingleton("ISaveModelReplyUseCase", SaveModelReply);
container.registerSingleton("ISaveSubChatUseCase", SaveSubChat);
container.registerSingleton("IUpdateChatUseCase", UpdateChat);
container.registerSingleton("IUploadChatImageUseCase", UploadChatImage);
