import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class DeleteFolder {
  constructor(
    @inject("IFolderRepository") private folderRepository: IFolderRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("IChatRepository") private chatRepository: IChatRepository
  ) {}

  async execute(folderId: string, userId: string) {
    const folder = await this.folderRepository.findByIdAndUserId(folderId, userId);
    if (!folder) {
      throw new AppError("Folder not found", 404);
    }
    if (folder.isSystemFolder) {
      throw new AppError("System folders are restricted and cannot be deleted", 403);
    }

    const idsToDelete: string[] = [folderId];
    const queue: string[] = [folderId];
    const seen = new Set<string>([folderId]);
    let head = 0;
    
    while (head < queue.length) {
      const parent = queue[head++];
      const children = await this.folderRepository.findChildren(parent);
      for (const c of children) {
        const id = c._id.toString();
        if (!seen.has(id)) {
          seen.add(id);
          idsToDelete.push(id);
          queue.push(id);
        }
      }
    }

    const chats = await this.chatRepository.findByFolderIds(userId, idsToDelete);
    const chatIds = chats.map((c) => c._id.toString());

    if (chatIds.length > 0) {
      try {
        await this.vectorRepository.deleteVectorsByChatIds(userId, chatIds);
      } catch (err: any) {
        throw err;
      }
    } else {
      console.log("No chats found for those folders — skipping Qdrant delete.");
    }

    await this.chatRepository.deleteManyByFolderIds(userId, idsToDelete);
    await this.folderRepository.deleteMany(idsToDelete, userId);

    return { deletedFolderCount: idsToDelete.length, deletedChatCount: chatIds.length };
  }
}
