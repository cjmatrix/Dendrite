import { IFolderRepository } from '../../../domain/folder/repositories/IFolderRepository';
import { injectable, inject } from 'tsyringe';
import { IGetFoldersUseCase } from './interfaces';

@injectable()
export class GetFolders implements IGetFoldersUseCase {
  constructor(
    @inject("IFolderRepository") private folderRepository: IFolderRepository
  ) {}

  async execute(userId: string) {
    const folders = await this.folderRepository.findAllByUserId(userId);

    const folderMap = new Map();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roots: any[] = [];

    for (const folder of folders) {
      folderMap.set(folder._id.toString(), {
        id: folder._id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentId,
        children: [],
        isExpanded: folder.isExpanded,
        isSystemFolder: folder.isSystemFolder
      });
    }

    for (const folder of folders) {
      const node = folderMap.get(folder._id.toString());
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId.toString());
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}
