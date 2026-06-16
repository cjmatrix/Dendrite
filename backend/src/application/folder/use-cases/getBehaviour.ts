import { inject, injectable } from "tsyringe";
import { IFolderRepository } from "../../../domain/folder/repositories/IFolderRepository";
import { AppError } from "../../../utils/AppError";
import { IFolder } from "../../../domain/folder/entities/Folder";
import { IGetbehaviorUseCase } from "./interfaces";

@injectable()
export class Getbehavior implements IGetbehaviorUseCase {
  constructor(
    @inject("IFolderRepository") private folderRepo: IFolderRepository,
  ) {}
  async execute(folderId: string, userId: string) {
    const folder = await this.folderRepo.findByIdAndUserId(folderId, userId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    const inherits = async (
      folderId: string | null,
      userId:string
    ) =>{
      if (!folderId) {
        return null;
      }

      const folder = await this.folderRepo.findByIdAndUserId(folderId, userId);
      if (!folder) {
        return null;
      }

      if (
        folder.behavior?.current?.content &&
        folder.behavior.current.content.trim() !== ""
      ) {
        return {parentName:folder.name ,parentContent:folder.behavior.current.content}
      }

      return await inherits(folder.parentId, userId);
    }



   




    return {currentBehavior:folder?.behavior,parentBehavior: await inherits(folder.parentId,userId)};
  }
}
