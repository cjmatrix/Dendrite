import { IFolder } from "../entities/Folder";
import { IBaseRepository } from "../../../application/common/ports/IBaseRepository";

export interface IFolderRepository extends IBaseRepository<IFolder> {
  findByIdAndUserId(id: string, userId: string): Promise<IFolder | null>;
  findByUserIdAndNameAndParent(userId: string, name: string, parentId: string | null): Promise<IFolder | null>;
  findAllByUserId(userId: string): Promise<IFolder[]>;
  findChildren(parentId: string): Promise<{ _id: string }[]>;
  update(id: string, userId: string, updates: Partial<IFolder>): Promise<IFolder | null>;
  deleteMany(ids: string[], userId: string): Promise<void>;
  insertMany(foldersData: Partial<IFolder>[]): Promise<IFolder[]>;
  findByParentId(parentId: string): Promise<IFolder[]>;
  findFolderSubtree(targetId:string):Promise<unknown>;
  findByPrefix(userId: string, parentId: string | null, prefix: string): Promise<IFolder[]>;
}
