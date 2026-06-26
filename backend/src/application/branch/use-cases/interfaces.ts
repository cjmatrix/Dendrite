export interface IInheritContextUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(chatId: string, userId: string, contextParentId: string): Promise<any>;
}

export interface IUnlinkInheritanceUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(chatId: string, userId: string): Promise<any>;
}
