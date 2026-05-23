import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class UpdateFolder {
  constructor(
    @inject("IFolderRepository") private folderRepository: IFolderRepository
  ) {}

  async execute(folderId: string, userId: string, updates: { name?: string, isExpanded?: boolean }) {
    if (updates.name) {
      const existingFolder = await this.folderRepository.findByIdAndUserId(folderId, userId);
      if (!existingFolder) {
        throw new AppError("Folder not found", 404);
      }
      if (existingFolder.isSystemFolder) {
        throw new AppError("System folders cannot be renamed", 403);
      }
    }

    const folder = await this.folderRepository.update(folderId, userId, updates);

    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    return folder;
  }
}
