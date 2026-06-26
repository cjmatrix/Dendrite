import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';
import { IFolderBehavior } from '../../../domain/folder/entities/Folder';
import { IUpdateFolderBehaviorUseCase } from './interfaces';

@injectable()
export class UpdateFolderBehavior implements IUpdateFolderBehaviorUseCase {
  constructor(
    @inject("IFolderRepository") private folderRepository: IFolderRepository
  ) {}

  async execute(folderId: string, userId: string, content: string) {
    const folder = await this.folderRepository.findByIdAndUserId(folderId, userId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }

    const currentBehavior: IFolderBehavior = folder.behavior || {
      current: { content: "", updatedAt: new Date() },
      history: [],
      settings: { sharingPolicy: "READ_WRITE" }
    };

    const history = [...(currentBehavior.history || [])];

   
    if (currentBehavior.current && currentBehavior.current.content && currentBehavior.current.content.trim() !== "") {
      history.push({
        content: currentBehavior.current.content,
        archivedAt: currentBehavior.current.updatedAt || new Date()
      });
    }

    const updatedBehavior: IFolderBehavior = {
      ...currentBehavior,
      current: {
        content: content,
        updatedAt: new Date()
      },
      history
    };

    const updatedFolder = await this.folderRepository.update(folderId, userId, {
      behavior: updatedBehavior
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    if (!updatedFolder) {
      throw new AppError("Failed to update folder behavior", 500);
    }

    return updatedFolder;
  }
}
