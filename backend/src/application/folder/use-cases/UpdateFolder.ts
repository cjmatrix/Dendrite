import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class UpdateFolder {
  constructor(
    @inject("IFolderRepository") private folderRepository: IFolderRepository
  ) {}

  async execute(folderId: string, userId: string, updates: { name?: string, isExpanded?: boolean, parentId?: string | null }) {
    if (updates.name) {
      const existingFolder = await this.folderRepository.findByIdAndUserId(folderId, userId);
      if (!existingFolder) {
        throw new AppError("Folder not found", 404);
      }
      if (existingFolder.isSystemFolder) {
        throw new AppError("System folders cannot be renamed", 403);
      }
    }

    if (updates.parentId !== undefined) {
      if (updates.parentId === folderId) {
        throw new AppError("Cannot move folder into itself", 400);
      }

      if (updates.parentId !== null) {
        let currentParentId: string | null = updates.parentId;
        while (currentParentId) {
          const parent = await this.folderRepository.findByIdAndUserId(currentParentId, userId);
          if (!parent) {
            throw new AppError("Target folder not found", 404);
          }
          if (parent._id === folderId) {
            throw new AppError("Cannot move folder into one of its subfolders", 400);
          }
          currentParentId = parent.parentId;
        }
      }
    }

    const folder = await this.folderRepository.update(folderId, userId, updates);

    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    return folder;
  }
}
