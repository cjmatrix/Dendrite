export interface IInheritContextUseCase {
  execute(chatId: string, userId: string, contextParentId: string): Promise<any>;
}

export interface IUnlinkInheritanceUseCase {
  execute(chatId: string, userId: string): Promise<any>;
}
