import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { AppError } from "../../../utils/AppError";
import { RegisterInputDTO } from "../dtos/auth.dto";
import { IUser } from "../../../domain/auth/entities/User";

import { injectable, inject } from "tsyringe";
import { IUnitOfWorkRepository } from "../../common/ports/IUnitOfWorkRepository";
import { IRegisterUserUseCase } from "./interfaces";

@injectable()
export class RegisterUser implements IRegisterUserUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("IFolderRepository") private folderRepository: IFolderRepository,
    @inject("IUnitOfWorkRepository")
    private unitOfWorkRepository: IUnitOfWorkRepository,
  ) {}

  async execute(userData: RegisterInputDTO): Promise<{ user: IUser }> {
    const { name, email, password } = userData;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && existingUser.status !== "pending") {
      throw new AppError("User already exists", 409);
    }
    

    return await this.unitOfWorkRepository.runInTransaction(async () => {

      
      if (existingUser && existingUser.status === "pending") {
        existingUser.name = name;
        existingUser.password = password; 

       let user = await this.userRepository.save(existingUser);

        return {user}
      } else {
        const user = await this.userRepository.create({
          name,
          email,
          password,
          status: "pending",
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

        return { user };
      }
    });
  }
}
