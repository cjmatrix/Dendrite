import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import { AppError } from '../../../utils/AppError';

export class DeleteChat {
  constructor(
    private chatRepository: IChatRepository,
    private vectorRepository: IVectorRepository
  ) {}

  async execute(chatId: string, userId: string) {
    try {
      await this.vectorRepository.deleteVectorsByChatIds(userId, [chatId]);
    } catch(err) {
      console.log("Failed to delete vectors:", err);
    }

    const chat = await this.chatRepository.delete(chatId, userId);

    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    return { deleted: true };
  }
}
