import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IGetChatsUseCase } from './interfaces';
import { ChatOutputDTO, ChatMapper } from '../dtos/chat.dto';
import { injectable, inject } from 'tsyringe';

@injectable()
export class GetChats implements IGetChatsUseCase {
  constructor(@inject("IChatRepository") private chatRepository: IChatRepository) {}

  async execute(userId: string): Promise<ChatOutputDTO[]> {
    const chats = await this.chatRepository.findAllByUserId(userId);
    return ChatMapper.toChatOutputList(chats);
  }
}
