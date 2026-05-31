import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IGetChatDocumentsUseCase } from './interfaces';
import { ChatDocument } from '../../../domain/chat/entities/Chat';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class GetChatDocuments implements IGetChatDocumentsUseCase {
  constructor(@inject("IChatRepository") private chatRepository: IChatRepository) {}

  async execute(chatId: string, userId: string): Promise<{ documents: ChatDocument[] }> {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    return { documents: chat.documents || [] };
  }
}
