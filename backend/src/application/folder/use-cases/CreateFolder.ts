import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { AppError } from '../../../utils/AppError';

export class CreateFolder {
  constructor(private folderRepository: IFolderRepository) {}

  async execute(userId: string, name: string, parentId: string | null) {
    const folder = await this.folderRepository.findByUserIdAndNameAndParent(userId, name, parentId);
    if (folder) {
      throw new AppError("Folder Already Exist", 400);
    }

    const newFolder = await this.folderRepository.create({ userId, name, parentId });
    return newFolder;
  }
}
