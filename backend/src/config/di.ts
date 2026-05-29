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

//admin


