import "reflect-metadata";
import { container } from "tsyringe";
import { MongoUserRepository } from "../infrastructure/auth/repositories/MongoUserRepository";
import { RedisShareLinkRepository } from "../infrastructure/shareLink/repositories/RedisShareLinkRepository";
import { CreateLink } from "../application/shareLink/use-cases/createLink";
import { ResolveLink } from "../application/shareLink/use-cases/resolveLink";
import { DownloadSharedLink } from "../application/shareLink/use-cases/downloadSharedLink";
import { MongooseUnitOfWork } from "../infrastructure/shared/MongooseUnitOfWork";
import { WinstonLoggerAdapter } from "../infrastructure/logger/WinstonLoggerAdapter";
import { ILogger } from "../application/common/ports/ILogger";

import { MongoFolderRepository } from "../infrastructure/folder/repositories/MongoFolderRepository";
import { MongoChatRepository } from "../infrastructure/chat/repositories/MongoChatRepository";
import { MongoMessageRepository } from "../infrastructure/chat/repositories/MongoMessageRepository";
import { MongoSubChatRepository } from "../infrastructure/chat/repositories/MongoSubChatRepository";
import { MongoCodeBlockRepository } from "../infrastructure/chat/repositories/MongoCodeBlockRepository";
import { MongoUploadedDocumentRepository } from "../infrastructure/chat/repositories/MongoUploadedDocumentRepository";
import { MongoContentHashRepository } from "../infrastructure/chat/repositories/MongoContentHashRepository";
import { MongoOutboxEventRepository } from "../infrastructure/outbox/repositories/MongoOutboxEventRepository";
import { AuthService } from "../infrastructure/auth/services/AuthService";
import { QdrantVectorRepository } from "../infrastructure/vector/repositories/QdrantVectorRepository";
import { MongoRecallRepository } from "../infrastructure/recall/repositories/MongoRecallRepository";
import { RedisOTPService } from "../infrastructure/auth/services/RedisOTPService";
import { BullMQEmbeddingPublisher } from "../infrastructure/shared/publishers/BullMQEmbeddingPublisher";
import { BullMQRecallPublisher } from "../infrastructure/shared/publishers/BullMQRecallPublisher";
import { BullMQDescriptionPublisher } from "../infrastructure/shared/publishers/BullMQDescriptionPublisher";
import { BullMQSummaryPublisher } from "../infrastructure/shared/publishers/BullMQSummaryPublisher";
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
import { UpdateByokKeys } from "../application/auth/use-cases/UpdateByokKeys";
import { GetByokKeys } from "../application/auth/use-cases/GetByokKeys";
import { ForgotPassword } from "../application/auth/use-cases/ForgotPassword";
import { ResetPassword } from "../application/auth/use-cases/ResetPassword";
import { AdminLoginUseCase } from "../application/admin/adminAuth/usecases/adminLoginUsecase";
import { AdminLogoutUseCase } from "../application/admin/adminAuth/usecases/AdminLogout";
import { AdminGetMeUseCase } from "../application/admin/adminAuth/usecases/AdminGetMe";
import { AdminRefreshUseCase } from "../application/admin/adminAuth/usecases/AdminRefresh";
import { FindAllUser } from "../application/admin/user/usecases/findAllUser";
import { GetUserDetails } from "../application/admin/user/usecases/GetUserDetails";
import { SuspendUser } from "../application/admin/user/usecases/suspendUser";
import { UnsuspendUser } from "../application/admin/user/usecases/unsuspendUser";
import { ToggleBanUser } from "../application/admin/user/usecases/toggleBanUser";
import { GetUserRateLimitUsage } from "../application/admin/user/usecases/GetUserRateLimitUsage";
import { ResetUserRateLimits } from "../application/admin/user/usecases/ResetUserRateLimits";
import { GetRateLimits } from "../application/admin/rateLimit/usecases/GetRateLimits";
import { UpdateRateLimit } from "../application/admin/rateLimit/usecases/UpdateRateLimit";
import { MongoRateLimitRepository } from "../infrastructure/auth/repositories/MongoRateLimitRepository";
import { MongoTransactionRepository } from "../infrastructure/billing/repositories/MongoTransactionRepository";

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

import { StreamQuickChat } from "../application/chat/use-cases/StreamQuickChat";
import { UploadDocument } from "../application/chat/use-cases/UploadDocument";
import { ValidateChatAccess } from "../application/chat/use-cases/ValidateChatAccess";
import { AIServiceAdapter } from "../infrastructure/services/AIServiceAdapter";
import { BullMQDocumentQueue } from "../infrastructure/queue/BullMQDocumentQueue";
import { PrometheusMetricsService } from "../infrastructure/monitoring/PrometheusMetricsService";
import { StreamAndSaveChatUseCase } from "../application/chat/use-cases/StreamAndSaveChatUseCase";
import { CreateCard } from "../application/recall/use-cases/CreateCard";
import { UpdateCard } from "../application/recall/use-cases/UpdateCard";
import { GetDueCards } from "../application/recall/use-cases/GetDueCards";
import { DeleteCard } from "../application/recall/use-cases/DeleteCard";
import { ClearAllCards } from "../application/recall/use-cases/ClearAllCards";
import { CountDueCards } from "../application/recall/use-cases/CountDueCards";
import { CreateFolder } from "../application/folder/use-cases/CreateFolder";
import { GetFolders } from "../application/folder/use-cases/GetFolders";
import { UpdateFolder } from "../application/folder/use-cases/UpdateFolder";
import { DeleteFolder } from "../application/folder/use-cases/DeleteFolder";
import { UpdateFolderBehavior } from "../application/folder/use-cases/UpdateFolderBehavior";
import { Getbehavior } from "../application/folder/use-cases/getBehaviour";
import { SearchExplorerUseCase } from "../application/folder/use-cases/SearchExplorerUseCase";
import { InheritContext } from "../application/branch/use-cases/InheritContext";
import { UnlinkInheritance } from "../application/branch/use-cases/UnlinkInheritance";
import { GenerateWorkspaceUseCase } from "../application/agent/use-cases/GenerateWorkspaceUseCase";

import { VoyageEmbeddingService } from "../infrastructure/services/VoyageEmbeddingService";
import { CloudinaryStorageAdapter } from "../infrastructure/services/CloudinaryStorageAdapter";
import { RedisDocumentProgressPublisher } from "../infrastructure/services/RedisDocumentProgressPublisher";
import { SemanticChunkingAdapter } from "../infrastructure/services/SemanticChunkingAdapter";
import { VoyageRerankerService } from "../infrastructure/services/VoyageRerankerService";
import { RedisActiveUserTracker } from "../infrastructure/services/RedisActiveUserTracker";
import { GetAdminDashboardStats } from "../application/admin/dashboard/usecases/GetAdminDashboardStats";
import { GetSubscriptionStats } from "../application/admin/dashboard/usecases/GetSubscriptionStats";
import { GetSystemHealth } from "../application/admin/dashboard/usecases/GetSystemHealth";
import { RateLimitService } from "../services/RateLimitService";

container.registerInstance("RedisClient", redisConnection);
container.registerSingleton("IEmbeddingService", VoyageEmbeddingService); // Easily switchable to JinaEmbeddingService!
container.registerSingleton("IRerankerService", VoyageRerankerService);
container.registerSingleton("IActiveUserTracker", RedisActiveUserTracker);
container.registerSingleton("GetAdminDashboardStats", GetAdminDashboardStats);
container.registerSingleton("GetSubscriptionStats", GetSubscriptionStats);
container.registerSingleton("GetSystemHealth", GetSystemHealth);
container.registerSingleton("IRateLimitService", RateLimitService);
container.registerSingleton("ICacheService", RedisCacheService);
container.registerSingleton<ILogger>("ILogger", WinstonLoggerAdapter);
container.registerSingleton("IMetricsService", PrometheusMetricsService);

container.registerSingleton("IRateLimitRepository", MongoRateLimitRepository);
container.registerSingleton("ITransactionRepository", MongoTransactionRepository);
container.registerSingleton("GetRateLimits", GetRateLimits);
container.registerSingleton("UpdateRateLimit", UpdateRateLimit);
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
container.registerSingleton(
  "IUploadedDocumentRepository",
  MongoUploadedDocumentRepository,
);
container.registerSingleton(
  "IContentHashRepository",
  MongoContentHashRepository,
);
container.registerSingleton(
  "IOutboxEventRepository",
  MongoOutboxEventRepository,
);
container.registerSingleton("IRecallRepository", MongoRecallRepository);
container.registerSingleton("ISharedLinkRepository", RedisShareLinkRepository);

// Publishers
container.registerSingleton("IEmbeddingPublisher", BullMQEmbeddingPublisher);
container.registerSingleton("IRecallPublisher", BullMQRecallPublisher);
container.registerSingleton(
  "IDescriptionPublisher",
  BullMQDescriptionPublisher,
);
container.registerSingleton("ISummaryPublisher", BullMQSummaryPublisher);
container.registerSingleton("IAIService", AIServiceAdapter);
container.registerSingleton("IDocumentQueue", BullMQDocumentQueue);
container.registerSingleton("IFileStorageService", CloudinaryStorageAdapter);
container.registerSingleton(
  "IDocumentProgressPublisher",
  RedisDocumentProgressPublisher,
);
container.registerSingleton(
  "IDocumentChunkingService",
  SemanticChunkingAdapter,
);

container.registerSingleton("IRegisterUserUseCase", RegisterUser);
container.registerSingleton("ILoginUserUseCase", LoginUser);
container.registerSingleton("IRefreshTokenUserUseCase", RefreshTokenUser);
container.registerSingleton("ILogoutUserUseCase", LogoutUser);
container.registerSingleton("IGetMeUseCase", GetMe);
container.registerSingleton("IUpdateFcmTokenUseCase", UpdateFcmToken);
container.registerSingleton("ISendOtpUseCase", SendOTP);
container.registerSingleton("IVerifyOtpUseCase", VerifyOTP);
container.registerSingleton("IGoogleLoginUseCase", GoogleLogin);
container.registerSingleton("IUpdateByokKeysUseCase", UpdateByokKeys);
container.registerSingleton("IGetByokKeysUseCase", GetByokKeys);
container.registerSingleton("IForgotPasswordUseCase", ForgotPassword);
container.registerSingleton("IResetPasswordUseCase", ResetPassword);
container.registerSingleton("ICreateLinkUseCase", CreateLink);
container.registerSingleton("IResolveLinkUseCase", ResolveLink);
container.registerSingleton("IDownloadSharedLinkUseCase", DownloadSharedLink);

container.registerSingleton("IAdminLoginUseCase", AdminLoginUseCase);
container.registerSingleton("IAdminLogoutUseCase", AdminLogoutUseCase);
container.registerSingleton("IAdminGetMeUseCase", AdminGetMeUseCase);
container.registerSingleton("IAdminRefreshUseCase", AdminRefreshUseCase);

container.registerSingleton("IFindAllUserUseCase", FindAllUser);
container.registerSingleton("IGetUserDetailsUseCase", GetUserDetails);
container.registerSingleton("ISuspendUserUseCase", SuspendUser);
container.registerSingleton("IUnsuspendUserUseCase", UnsuspendUser);
container.registerSingleton("IToggleBanUserUseCase", ToggleBanUser);
container.registerSingleton("IGetUserRateLimitUsageUseCase", GetUserRateLimitUsage);
container.registerSingleton("IResetUserRateLimitsUseCase", ResetUserRateLimits);

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
container.registerSingleton("IStreamQuickChatUseCase", StreamQuickChat);
container.registerSingleton("IUploadDocumentUseCase", UploadDocument);
container.registerSingleton("IValidateChatAccessUseCase", ValidateChatAccess);
container.registerSingleton(
  "IStreamAndSaveChatUseCase",
  StreamAndSaveChatUseCase,
);

container.registerSingleton("ICreateCardUseCase", CreateCard);
container.registerSingleton("IUpdateCardUseCase", UpdateCard);
container.registerSingleton("IGetDueCardsUseCase", GetDueCards);
container.registerSingleton("IDeleteCardUseCase", DeleteCard);
container.registerSingleton("IClearAllCardsUseCase", ClearAllCards);
container.registerSingleton("ICountDueCardsUseCase", CountDueCards);

container.registerSingleton("ICreateFolderUseCase", CreateFolder);
container.registerSingleton("IGetFoldersUseCase", GetFolders);
container.registerSingleton("IUpdateFolderUseCase", UpdateFolder);
container.registerSingleton("IDeleteFolderUseCase", DeleteFolder);
container.registerSingleton(
  "IUpdateFolderBehaviorUseCase",
  UpdateFolderBehavior,
);
container.registerSingleton("IGetbehaviorUseCase", Getbehavior);
container.registerSingleton("SearchExplorerUseCase", SearchExplorerUseCase);

container.registerSingleton("IInheritContextUseCase", InheritContext);
container.registerSingleton("IUnlinkInheritanceUseCase", UnlinkInheritance);

container.registerSingleton(
  "GenerateWorkspaceUseCase",
  GenerateWorkspaceUseCase,
);

import { PaddleService } from "../infrastructure/shared/services/PaddleService";
import { CreateCheckoutSession } from "../application/billing/use-cases/CreateCheckoutSession";
import { CreatePortalSession } from "../application/billing/use-cases/CreatePortalSession";
import { HandleWebhook } from "../application/billing/use-cases/HandleWebhook";

container.registerSingleton("IBillingProvider", PaddleService);
container.registerSingleton("ICreateCheckoutSessionUseCase", CreateCheckoutSession);
container.registerSingleton("ICreatePortalSessionUseCase", CreatePortalSession);
container.registerSingleton("IHandleWebhookUseCase", HandleWebhook);

export { container };
