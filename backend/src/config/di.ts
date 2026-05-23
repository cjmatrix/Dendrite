import "reflect-metadata";
import { container } from "tsyringe";
import { MongoUserRepository } from "../infrastructure/auth/repositories/MongoUserRepository";
import { MongooseUnitOfWork } from "../infrastructure/shared/MongooseUnitOfWork";

import { MongoFolderRepository } from "../infrastructure/folder/repositories/MongoFolderRepository";
import { AuthService } from "../infrastructure/auth/services/AuthService";
import { MongoChatRepository } from "../infrastructure/chat/repositories/MongoChatRepository";
import { QdrantVectorRepository } from "../infrastructure/vector/repositories/QdrantVectorRepository";

container.registerSingleton("IUserRepository", MongoUserRepository);
container.registerSingleton("IUnitOfWorkRepository", MongooseUnitOfWork);
container.registerSingleton("IFolderRepository", MongoFolderRepository);
container.registerSingleton("IAuthService", AuthService);
container.registerSingleton("IChatRepository", MongoChatRepository);
container.registerSingleton("IVectorRepository", QdrantVectorRepository);
