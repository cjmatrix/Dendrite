export interface IFolder {
  _id: string;
  userId: string;
  name: string;
  parentId: string | null;
  isSystemFolder: boolean;
  color: string;
  isExpanded: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
