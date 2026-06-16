export interface ICreateFolderUseCase {
  execute(userId: string, name: string, parentId: string | null): Promise<any>;
}

export interface IGetFoldersUseCase {
  execute(userId: string): Promise<any>;
}

export interface IUpdateFolderUseCase {
  execute(
    folderId: string,
    userId: string,
    updates: { name?: string; isExpanded?: boolean; parentId?: string | null }
  ): Promise<any>;
}

export interface IDeleteFolderUseCase {
  execute(folderId: string, userId: string): Promise<any>;
}

export interface IUpdateFolderBehaviorUseCase {
  execute(folderId: string, userId: string, content: string): Promise<any>;
}

export interface IGetbehaviorUseCase {
  execute(folderId: string, userId: string): Promise<any>;
}
