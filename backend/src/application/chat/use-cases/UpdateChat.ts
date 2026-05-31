import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IUpdateChatUseCase } from './interfaces';
import { UpdateChatInputDTO, ChatOutputDTO, ChatMapper } from '../dtos/chat.dto';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class UpdateChat implements IUpdateChatUseCase {
  constructor(@inject("IChatRepository") private chatRepository: IChatRepository) {}

  async execute(input: UpdateChatInputDTO): Promise<ChatOutputDTO> {
    const { chatId, userId, title, folderId } = input;

    const chat = await this.chatRepository.update(chatId, userId, { title, folderId });
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }
    return ChatMapper.toChatOutput(chat);
  }
}
