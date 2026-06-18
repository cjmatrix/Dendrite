export interface IGenerateWorkspaceUseCase {
  execute(params: { chatId: string; message: string; userId: string }): Promise<any>;
}