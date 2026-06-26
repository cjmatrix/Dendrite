export interface IGenerateWorkspaceUseCase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  execute(params: { chatId: string; message: string; userId: string }): Promise<any>;
}