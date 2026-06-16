import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { ICreateChatUseCase } from './interfaces';
import { CreateChatInputDTO, ChatOutputDTO, ChatMapper } from '../dtos/chat.dto';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class CreateChat implements ICreateChatUseCase {
  constructor(@inject("IChatRepository") private chatRepository: IChatRepository) {}

  async execute(input: CreateChatInputDTO): Promise<ChatOutputDTO> {
    const { userId, title, folderId ,type} = input;

    const existing = await this.chatRepository.findByUserIdAndTitleAndFolderId(userId, title, folderId || null);
    if (existing) {
      throw new AppError("Chat with this title already exists in this folder", 400);
    }

    if(type&&type==="agent"){
       const chat = await this.chatRepository.create({ userId, title, folderId,type });
      return ChatMapper.toChatOutput(chat)
    }
    else
    {
      const chat = await this.chatRepository.create({ userId, title, folderId });
      return ChatMapper.toChatOutput(chat)
    }
 ;
  }
}
