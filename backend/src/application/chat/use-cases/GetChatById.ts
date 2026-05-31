import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IGetChatByIdUseCase } from './interfaces';
import { ChatOutputDTO, ChatMapper } from '../dtos/chat.dto';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class GetChatById implements IGetChatByIdUseCase {
  constructor(@inject("IChatRepository") private chatRepository: IChatRepository) {}

  async execute(chatId: string, userId: string): Promise<ChatOutputDTO> {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    return ChatMapper.toChatOutput(chat);
  }
}
