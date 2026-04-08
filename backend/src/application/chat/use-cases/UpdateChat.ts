import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { AppError } from '../../../utils/AppError';

export class UpdateChat {
  constructor(private chatRepository: IChatRepository) {}

  async execute(chatId: string, userId: string, updates: { title?: string; folderId?: string | null }) {
    const chat = await this.chatRepository.update(chatId, userId, updates);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    return chat;
  }
}
