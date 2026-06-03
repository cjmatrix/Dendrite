export interface IFolderBehavior {
  current: {
    content: string;
    updatedAt: Date;
  };
  history: Array<{
    content: string;
    archivedAt: Date;
  }>;
  settings?: {
    sharingPolicy: 'READ_ONLY' | 'READ_WRITE' | 'INVISIBLE';
  };
}

export interface IFolder {
  _id: string;
  userId: string;
  name: string;
  parentId: string | null;
  isSystemFolder: boolean;
  color: string;
  isExpanded: boolean;
  ownerId?: string;
  behavior?: IFolderBehavior;
  createdAt?: Date;
  updatedAt?: Date;
}
