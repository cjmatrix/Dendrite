import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';
import { ICreateFolderUseCase } from './interfaces';

@injectable()
export class CreateFolder implements ICreateFolderUseCase {
  constructor(
    @inject("IFolderRepository") private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string, name: string, parentId: string | null) {
    const folder = await this.folderRepository.findByUserIdAndNameAndParent(userId, name, parentId);
    if (folder) {
      throw new AppError("Folder Already Exist", 400);
    }

    const newFolder = await this.folderRepository.create({ userId, name, parentId,ownerId:userId });
    return newFolder;
  }
}
