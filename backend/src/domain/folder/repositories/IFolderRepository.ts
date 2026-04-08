export interface IFolderRepository {
  findByIdAndUserId(id: string, userId: string): Promise<any | null>;
  findByUserIdAndNameAndParent(userId: string, name: string, parentId: string | null): Promise<any | null>;
  findAllByUserId(userId: string): Promise<any[]>;
  findChildren(parentId: string): Promise<any[]>;
  create(folderData: any): Promise<any>;
  update(id: string, userId: string, updates: any): Promise<any | null>;
  deleteMany(ids: string[], userId: string): Promise<void>;
}
