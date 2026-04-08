import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { AppError } from '../../../utils/AppError';

export class GetChatById {
  constructor(private chatRepository: IChatRepository) {}

  async execute(chatId: string, userId: string) {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    return chat;
  }
}
