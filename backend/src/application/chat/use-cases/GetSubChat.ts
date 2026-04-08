import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';
import { AppError } from '../../../utils/AppError';

export class GetSubChat {
  constructor(private subChatRepository: ISubChatRepository) {}

  async execute(chatId: string, subChatId: string, userId: string) {
    const subChat = await this.subChatRepository.findByIdAndUserId(subChatId, chatId, userId);
    return subChat || null;
  }
}
