import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { AppError } from '../../../utils/AppError';

export class UnlinkInheritance {
  constructor(private chatRepository: IChatRepository) {}

  async execute(chatId: string, userId: string) {
    if (!chatId) {
      throw new AppError("Missing chat ID", 400);
    }

    const updatedChat = await this.chatRepository.update(chatId, userId, { 
      contextParent: null 
    });

    if (!updatedChat) {
      throw new AppError("Chat not found or unauthorized", 404);
    }

    return updatedChat;
  }
}
