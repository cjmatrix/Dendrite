export interface ICreateFolderUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string, name: string, parentId: string | null): Promise<any>;
}

export interface IGetFoldersUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(userId: string): Promise<any>;
}

export interface IUpdateFolderUseCase {
  execute(
    folderId: string,
    userId: string,
    updates: { name?: string; isExpanded?: boolean; parentId?: string | null }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any>;
}

export interface IDeleteFolderUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(folderId: string, userId: string): Promise<any>;
}

export interface IUpdateFolderBehaviorUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(folderId: string, userId: string, content: string): Promise<any>;
}

export interface IGetbehaviorUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(folderId: string, userId: string): Promise<any>;
}
