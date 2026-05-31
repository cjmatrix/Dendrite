import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';
import { IGetSubChatUseCase } from './interfaces';
import { injectable, inject } from 'tsyringe';

@injectable()
export class GetSubChat implements IGetSubChatUseCase {
  constructor(@inject("ISubChatRepository") private subChatRepository: ISubChatRepository) {}

  async execute(chatId: string, subChatId: string, userId: string) {
    const subChat = await this.subChatRepository.findByIdAndUserId(subChatId, chatId, userId);
    return subChat || null;
  }
}
