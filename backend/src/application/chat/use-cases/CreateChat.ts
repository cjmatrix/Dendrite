import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { AppError } from '../../../utils/AppError';

export class CreateChat {
  constructor(private chatRepository: IChatRepository) {}

  async execute(userId: string, title: string, folderId: string | null) {
    const chat = await this.chatRepository.findByUserIdAndTitleAndFolderId(userId, title, folderId);
    if (chat) {
      throw new AppError("Chat with this title already exists in this folder", 400);
    }
    return await this.chatRepository.create({ userId, title, folderId });
  }
}
