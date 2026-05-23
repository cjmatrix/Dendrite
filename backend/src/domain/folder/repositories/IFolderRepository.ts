import { IFolder } from "../entities/Folder";

export interface IFolderRepository {
  findByIdAndUserId(id: string, userId: string): Promise<IFolder | null>;
  findByUserIdAndNameAndParent(userId: string, name: string, parentId: string | null): Promise<IFolder | null>;
  findAllByUserId(userId: string): Promise<IFolder[]>;
  findChildren(parentId: string): Promise<{ _id: string }[]>;
  create(folderData: Partial<IFolder>): Promise<IFolder>;
  update(id: string, userId: string, updates: Partial<IFolder>): Promise<IFolder | null>;
  deleteMany(ids: string[], userId: string): Promise<void>;
  insertMany(foldersData: Partial<IFolder>[]): Promise<IFolder[]>;
}
