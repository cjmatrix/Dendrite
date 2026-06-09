import { MongoFolderRepository } from '../../../infrastructure/folder/repositories/MongoFolderRepository';
import { MongoChatRepository } from '../../../infrastructure/chat/repositories/MongoChatRepository';
import { MongoMessageRepository } from '../../../infrastructure/chat/repositories/MongoMessageRepository';
import { MongoSubChatRepository } from '../../../infrastructure/chat/repositories/MongoSubChatRepository';
import { MongoCodeBlockRepository } from '../../../infrastructure/chat/repositories/MongoCodeBlockRepository';
import { MongoOutboxEventRepository } from '../../../infrastructure/outbox/repositories/MongoOutboxEventRepository';
import { MongoUserRepository } from '../../../infrastructure/auth/repositories/MongoUserRepository';
import { MongoRecallRepository } from '../../../infrastructure/recall/repositories/MongoRecallRepository';
import { QdrantVectorRepository } from '../../../infrastructure/vector/repositories/QdrantVectorRepository';
import { MongooseUnitOfWork } from '../../../infrastructure/shared/MongooseUnitOfWork';
import { AuthService } from '../../../infrastructure/auth/services/AuthService';
import { BullMQRecallPublisher } from '../../../infrastructure/shared/publishers/BullMQRecallPublisher';
import { IRecallPublisher } from '../../../application/common/ports/IRecallPublisher';
import { BullMQDescriptionPublisher } from '../../../infrastructure/shared/publishers/BullMQDescriptionPublisher';
import { IDescriptionPublisher } from '../../../application/common/ports/IDescriptionPublisher';
import { BullMQSummaryPublisher } from '../../../infrastructure/shared/publishers/BullMQSummaryPublisher';
import { ISummaryPublisher } from '../../../application/common/ports/ISummaryPublisher';
import { WinstonLoggerAdapter } from '../../../infrastructure/logger/WinstonLoggerAdapter';
import { ILogger } from '../../../application/common/ports/ILogger';
import { IMetricsService } from '../../../application/common/ports/IMetricsService';
import { PrometheusMetricsService } from '../../../infrastructure/monitoring/PrometheusMetricsService';

import { CreateFolder } from '../../../application/folder/use-cases/CreateFolder';
import { GetFolders } from '../../../application/folder/use-cases/GetFolders';
import { UpdateFolder } from '../../../application/folder/use-cases/UpdateFolder';
import { DeleteFolder } from '../../../application/folder/use-cases/DeleteFolder';
import { UpdateFolderBehavior } from '../../../application/folder/use-cases/UpdateFolderBehavior';

import { CreateChat } from '../../../application/chat/use-cases/CreateChat';
import { GetChats } from '../../../application/chat/use-cases/GetChats';
import { GetChatById } from '../../../application/chat/use-cases/GetChatById';
import { GetChatMessages } from '../../../application/chat/use-cases/GetChatMessages';
import { UpdateChat } from '../../../application/chat/use-cases/UpdateChat';
import { DeleteChat } from '../../../application/chat/use-cases/DeleteChat';
import { PrepareMessage } from '../../../application/chat/use-cases/PrepareMessage';
import { SaveModelReply } from '../../../application/chat/use-cases/SaveModelReply';
import { SaveSubChat } from '../../../application/chat/use-cases/SaveSubChat';
import { GetSubChat } from '../../../application/chat/use-cases/GetSubChat';

import { RegisterUser } from '../../../application/auth/use-cases/RegisterUser';
import { LoginUser } from '../../../application/auth/use-cases/LoginUser';
import { SendOTP } from '../../../application/auth/use-cases/SendOTP';
import { VerifyOTP } from '../../../application/auth/use-cases/VerifyOTP';
import { RedisOTPService } from '../../../infrastructure/auth/services/RedisOTPService';
import { NodemailerEmailService } from '../../../infrastructure/shared/services/NodemailerEmailService';
import { redisConnection } from '../../../config/redis';
import { RedisCacheService } from '../../../infrastructure/cache/RedisCacheService';
import { RefreshTokenUser } from '../../../application/auth/use-cases/RefreshTokenUser';
import { LogoutUser } from '../../../application/auth/use-cases/LogoutUser';
import { GetMe } from '../../../application/auth/use-cases/GetMe';
import { UpdateFcmToken } from '../../../application/auth/use-cases/UpdateFcmToken';
import { GoogleLogin } from '../../../application/auth/use-cases/GoogleLogin';

import { CreateCard } from '../../../application/recall/use-cases/CreateCard';
import { UpdateCard } from '../../../application/recall/use-cases/UpdateCard';
import { GetDueCards } from '../../../application/recall/use-cases/GetDueCards';
import { DeleteCard } from '../../../application/recall/use-cases/DeleteCard';
import { ClearAllCards } from '../../../application/recall/use-cases/ClearAllCards';
import { CountDueCards } from '../../../application/recall/use-cases/CountDueCards';

import { InheritContext } from '../../../application/branch/use-cases/InheritContext';
import { UnlinkInheritance } from '../../../application/branch/use-cases/UnlinkInheritance';
import { ProcessDocumentChunking } from '../../../application/worker/use-cases/ProcessDocumentChunking';


export class DIContainer {
  // Repositories (singletons)
  private static folderRepository: MongoFolderRepository;
  private static chatRepository: MongoChatRepository;
  private static messageRepository: MongoMessageRepository;
  private static subChatRepository: MongoSubChatRepository;
  private static codeBlockRepository: MongoCodeBlockRepository;
  private static outboxEventRepository: MongoOutboxEventRepository;
  private static userRepository: MongoUserRepository;
  private static recallRepository: MongoRecallRepository;
  private static vectorRepository: QdrantVectorRepository;
  private static unitOfWorkRepository: MongooseUnitOfWork;
  private static authService: AuthService;
  private static recallPublisher: BullMQRecallPublisher;
  private static descriptionPublisher: BullMQDescriptionPublisher;
  private static summaryPublisher: BullMQSummaryPublisher;
  private static logger: ILogger;
  private static metricsService: IMetricsService;

  // Folder Use Cases
  private static createFolderUseCase: CreateFolder;
  private static getFoldersUseCase: GetFolders;
  private static updateFolderUseCase: UpdateFolder;
  private static deleteFolderUseCase: DeleteFolder;
  private static updateFolderBehaviorUseCase: UpdateFolderBehavior;

  // Chat Use Cases
  private static createChatUseCase: CreateChat;
  private static getChatsUseCase: GetChats;
  private static getChatByIdUseCase: GetChatById;
  private static getChatMessagesUseCase: GetChatMessages;
  private static updateChatUseCase: UpdateChat;
  private static deleteChatUseCase: DeleteChat;
  private static prepareMessageUseCase: PrepareMessage;
  private static saveModelReplyUseCase: SaveModelReply;
  private static saveSubChatUseCase: SaveSubChat;
  private static getSubChatUseCase: GetSubChat;

  // Auth Use Cases
  private static registerUserUseCase: RegisterUser;
  private static loginUserUseCase: LoginUser;
  private static refreshTokenUserUseCase: RefreshTokenUser;
  private static logoutUserUseCase: LogoutUser;
  private static getMeUseCase: GetMe;
  private static updateFcmTokenUseCase: UpdateFcmToken;
  private static otpService: RedisOTPService;
  private static cacheService: RedisCacheService;
  private static emailService: NodemailerEmailService;
  private static sendOtpUseCase: SendOTP;
  private static verifyOtpUseCase: VerifyOTP;
  private static googleLoginUseCase: GoogleLogin;

  // Recall Use Cases
  private static createCardUseCase: CreateCard;
  private static updateCardUseCase: UpdateCard;
  private static getDueCardsUseCase: GetDueCards;
  private static deleteCardUseCase: DeleteCard;
  private static clearAllCardsUseCase: ClearAllCards;
  private static countDueCardsUseCase: CountDueCards;

  // Branch Use Cases
  private static inheritContextUseCase: InheritContext;
  private static unlinkInheritanceUseCase: UnlinkInheritance;

  // Worker Use Cases
  private static processDocumentChunkingUseCase: ProcessDocumentChunking;

 
  static getFolderRepository(): MongoFolderRepository {
    if (!this.folderRepository) {
      this.folderRepository = new MongoFolderRepository();
    }
    return this.folderRepository;
  }

  static 
  getChatRepository(): MongoChatRepository {
    if (!this.chatRepository) {
      this.chatRepository = new MongoChatRepository();
    }
    return this.chatRepository;
  }

  static getMessageRepository(): MongoMessageRepository {
    if (!this.messageRepository) {
      this.messageRepository = new MongoMessageRepository();
    }
    return this.messageRepository;
  }

  static getSubChatRepository(): MongoSubChatRepository {
    if (!this.subChatRepository) {
      this.subChatRepository = new MongoSubChatRepository();
    }
    return this.subChatRepository;
  }

  static getCodeBlockRepository(): MongoCodeBlockRepository {
    if (!this.codeBlockRepository) {
      this.codeBlockRepository = new MongoCodeBlockRepository();
    }
    return this.codeBlockRepository;
  }

  static getOutboxEventRepository(): MongoOutboxEventRepository {
    if (!this.outboxEventRepository) {
      this.outboxEventRepository = new MongoOutboxEventRepository();
    }
    return this.outboxEventRepository;
  }

  static getUserRepository(): MongoUserRepository {
    if (!this.userRepository) {
      this.userRepository = new MongoUserRepository();
    }
    return this.userRepository;
  }

  static getRecallRepository(): MongoRecallRepository {
    if (!this.recallRepository) {
      this.recallRepository = new MongoRecallRepository();
    }
    return this.recallRepository;
  }

  static getVectorRepository(): QdrantVectorRepository {
    if (!this.vectorRepository) {
      this.vectorRepository = new QdrantVectorRepository();
    }
    return this.vectorRepository;
  }

  static getUnitOfWorkRepository(): MongooseUnitOfWork {
    if (!this.unitOfWorkRepository) {
      this.unitOfWorkRepository = new MongooseUnitOfWork();
    }
    return this.unitOfWorkRepository;
  }

  static getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = new AuthService();
    }
    return this.authService;
  }

  
  static getCreateFolderUseCase(): CreateFolder {
    if (!this.createFolderUseCase) {
      this.createFolderUseCase = new CreateFolder(this.getFolderRepository());
    }
    return this.createFolderUseCase;
  }

  static getGetFoldersUseCase(): GetFolders {
    if (!this.getFoldersUseCase) {
      this.getFoldersUseCase = new GetFolders(this.getFolderRepository());
    }
    return this.getFoldersUseCase;
  }

  static getUpdateFolderUseCase(): UpdateFolder {
    if (!this.updateFolderUseCase) {
      this.updateFolderUseCase = new UpdateFolder(this.getFolderRepository());
    }
    return this.updateFolderUseCase;
  }

  static getUpdateFolderBehaviorUseCase(): UpdateFolderBehavior {
    if (!this.updateFolderBehaviorUseCase) {
      this.updateFolderBehaviorUseCase = new UpdateFolderBehavior(this.getFolderRepository());
    }
    return this.updateFolderBehaviorUseCase;
  }

  static getDeleteFolderUseCase(): DeleteFolder {
    if (!this.deleteFolderUseCase) {
      this.deleteFolderUseCase = new DeleteFolder(
        this.getFolderRepository(),
        this.getVectorRepository(),
        this.getChatRepository(),
      );
    }
    return this.deleteFolderUseCase;
  }

 
  static getCreateChatUseCase(): CreateChat {
    if (!this.createChatUseCase) {
      this.createChatUseCase = new CreateChat(this.getChatRepository());
    }
    return this.createChatUseCase;
  }

  static getGetChatsUseCase(): GetChats {
    if (!this.getChatsUseCase) {
      this.getChatsUseCase = new GetChats(this.getChatRepository());
    }
    return this.getChatsUseCase;
  }

  static getGetChatByIdUseCase(): GetChatById {
    if (!this.getChatByIdUseCase) {
      this.getChatByIdUseCase = new GetChatById(this.getChatRepository());
    }
    return this.getChatByIdUseCase;
  }

  static getGetChatMessagesUseCase(): GetChatMessages {
    if (!this.getChatMessagesUseCase) {
      this.getChatMessagesUseCase = new GetChatMessages(
        this.getChatRepository(),
        this.getMessageRepository(),
        this.getSubChatRepository(),
      );
    }
    return this.getChatMessagesUseCase;
  }

  static getUpdateChatUseCase(): UpdateChat {
    if (!this.updateChatUseCase) {
      this.updateChatUseCase = new UpdateChat(this.getChatRepository());
    }
    return this.updateChatUseCase;
  }

  static getDeleteChatUseCase(): DeleteChat {
    if (!this.deleteChatUseCase) {
      this.deleteChatUseCase = new DeleteChat(
        this.getChatRepository(),
        this.getVectorRepository(),
        this.getSubChatRepository(),
        this.getMessageRepository(),
        this.getCodeBlockRepository(),
        this.getUnitOfWorkRepository(),
        this.getLogger(),
      );
    }
    return this.deleteChatUseCase;
  }

  static getPrepareMessageUseCase(): PrepareMessage {
    if (!this.prepareMessageUseCase) {
      this.prepareMessageUseCase = new PrepareMessage(
        this.getVectorRepository(),
        this.getChatRepository(),
        this.getMessageRepository(),
        this.getUserRepository(),
        this.getFolderRepository(),
        this.getLogger(),
      );
    }
    return this.prepareMessageUseCase;
  }

  static getSaveModelReplyUseCase(): SaveModelReply {
    if (!this.saveModelReplyUseCase) {
      this.saveModelReplyUseCase = new SaveModelReply(
        this.getChatRepository(),
        this.getMessageRepository(),
        this.getCodeBlockRepository(),
        this.getOutboxEventRepository(),
        this.getDescriptionPublisher(),
        this.getSummaryPublisher(),
        this.getUnitOfWorkRepository(),
        this.getUserRepository(),
        this.getLogger(),
      );
    }
    return this.saveModelReplyUseCase;
  }

  static getSaveSubChatUseCase(): SaveSubChat {
    if (!this.saveSubChatUseCase) {
      this.saveSubChatUseCase = new SaveSubChat(this.getSubChatRepository());
    }
    return this.saveSubChatUseCase;
  }

  static getGetSubChatUseCase(): GetSubChat {
    if (!this.getSubChatUseCase) {
      this.getSubChatUseCase = new GetSubChat(this.getSubChatRepository());
    }
    return this.getSubChatUseCase;
  }

  
  static getRegisterUserUseCase(): RegisterUser {
    if (!this.registerUserUseCase) {
      this.registerUserUseCase = new RegisterUser(
        this.getUserRepository(),
        this.getFolderRepository(),
        this.getUnitOfWorkRepository()
      );
    }
    return this.registerUserUseCase;
  }

  static getLoginUserUseCase(): LoginUser {
    if (!this.loginUserUseCase) {
      this.loginUserUseCase = new LoginUser(
        this.getUserRepository(),
        this.getAuthService(),
        this.getCacheService()
      );
    }
    return this.loginUserUseCase;
  }

  static getRefreshTokenUserUseCase(): RefreshTokenUser {
    if (!this.refreshTokenUserUseCase) {
      this.refreshTokenUserUseCase = new RefreshTokenUser(
        this.getUserRepository(),
        this.getAuthService(),
        this.getCacheService()
      );
    }
    return this.refreshTokenUserUseCase;
  }

  static getLogoutUserUseCase(): LogoutUser {
    if (!this.logoutUserUseCase) {
      this.logoutUserUseCase = new LogoutUser(
        this.getAuthService(),
        this.getCacheService()
      );
    }
    return this.logoutUserUseCase;
  }

  static getGetMeUseCase(): GetMe {
    if (!this.getMeUseCase) {
      this.getMeUseCase = new GetMe(this.getUserRepository());
    }
    return this.getMeUseCase;
  }

  static getUpdateFcmTokenUseCase(): UpdateFcmToken {
    if (!this.updateFcmTokenUseCase) {
      this.updateFcmTokenUseCase = new UpdateFcmToken(this.getUserRepository());
    }
    return this.updateFcmTokenUseCase;
  }

  static getCacheService(): RedisCacheService {
    if (!this.cacheService) {
      this.cacheService = new RedisCacheService(redisConnection);
    }
    return this.cacheService;
  }

  static getOtpService(): RedisOTPService {
    if (!this.otpService) {
      this.otpService = new RedisOTPService(this.getCacheService());
    }
    return this.otpService;
  }

  static getEmailService(): NodemailerEmailService {
    if (!this.emailService) {
      this.emailService = new NodemailerEmailService();
    }
    return this.emailService;
  }

  static getRecallPublisher(): IRecallPublisher {
    if (!this.recallPublisher) {
      this.recallPublisher = new BullMQRecallPublisher();
    }
    return this.recallPublisher;
  }

  static getDescriptionPublisher(): IDescriptionPublisher {
    if (!this.descriptionPublisher) {
      this.descriptionPublisher = new BullMQDescriptionPublisher();
    }
    return this.descriptionPublisher;
  }

  static getSummaryPublisher(): ISummaryPublisher {
    if (!this.summaryPublisher) {
      this.summaryPublisher = new BullMQSummaryPublisher();
    }
    return this.summaryPublisher;
  }

  static getLogger(): ILogger {
    if (!this.logger) {
      this.logger = new WinstonLoggerAdapter("Dentrites");
    }
    return this.logger;
  }

  static getMetricsService(): IMetricsService {
    if (!this.metricsService) {
      this.metricsService = new PrometheusMetricsService();
    }
    return this.metricsService;
  }

  static getSendOtpUseCase(): SendOTP {
    if (!this.sendOtpUseCase) {
      this.sendOtpUseCase = new SendOTP(this.getOtpService(), this.getEmailService());
    }
    return this.sendOtpUseCase;
  }

  static getVerifyOtpUseCase(): VerifyOTP {
    if (!this.verifyOtpUseCase) {
      this.verifyOtpUseCase = new VerifyOTP(this.getOtpService(), this.getUserRepository());
    }
    return this.verifyOtpUseCase;
  }

  static getGoogleLoginUseCase(): GoogleLogin {
    if (!this.googleLoginUseCase) {
      this.googleLoginUseCase = new GoogleLogin(
        this.getUserRepository(),
        this.getFolderRepository(),
        this.getAuthService(),
        this.getCacheService(),
        this.getUnitOfWorkRepository()
      );
    }
    return this.googleLoginUseCase;
  }

  
  static getCreateCardUseCase(): CreateCard {
    if (!this.createCardUseCase) {
      this.createCardUseCase = new CreateCard(this.getRecallRepository(), this.getRecallPublisher());
    }
    return this.createCardUseCase;
  }

  static getUpdateCardUseCase(): UpdateCard {
    if (!this.updateCardUseCase) {
      this.updateCardUseCase = new UpdateCard(this.getRecallRepository(), this.getRecallPublisher());
    }
    return this.updateCardUseCase;
  }

  static getGetDueCardsUseCase(): GetDueCards {
    if (!this.getDueCardsUseCase) {
      this.getDueCardsUseCase = new GetDueCards(this.getRecallRepository());
    }
    return this.getDueCardsUseCase;
  }

  static getDeleteCardUseCase(): DeleteCard {
    if (!this.deleteCardUseCase) {
      this.deleteCardUseCase = new DeleteCard(this.getRecallRepository(), this.getRecallPublisher());
    }
    return this.deleteCardUseCase;
  }

  static getClearAllCardsUseCase(): ClearAllCards {
    if (!this.clearAllCardsUseCase) {
      this.clearAllCardsUseCase = new ClearAllCards(this.getRecallRepository(), this.getRecallPublisher());
    }
    return this.clearAllCardsUseCase;
  }

  static getCountDueCardsUseCase(): CountDueCards {
    if (!this.countDueCardsUseCase) {
      this.countDueCardsUseCase = new CountDueCards(this.getRecallRepository());
    }
    return this.countDueCardsUseCase;
  }

  static getInheritContextUseCase(): InheritContext {
    if (!this.inheritContextUseCase) {
      this.inheritContextUseCase = new InheritContext(this.getChatRepository());
    }
    return this.inheritContextUseCase;
  }

  static getUnlinkInheritanceUseCase(): UnlinkInheritance {
    if (!this.unlinkInheritanceUseCase) {
      this.unlinkInheritanceUseCase = new UnlinkInheritance(this.getChatRepository());
    }
    return this.unlinkInheritanceUseCase;
  }

  static getProcessDocumentChunkingUseCase(): ProcessDocumentChunking {
    if (!this.processDocumentChunkingUseCase) {
      this.processDocumentChunkingUseCase = new ProcessDocumentChunking(
        this.getOutboxEventRepository(),
        this.getVectorRepository(),
        this.getLogger()
      );
    }
    return this.processDocumentChunkingUseCase;
  }
}
