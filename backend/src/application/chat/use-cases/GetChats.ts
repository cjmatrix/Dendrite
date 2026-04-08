import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';

export class GetChats {
  constructor(private chatRepository: IChatRepository) {}

  async execute(userId: string) {
    return await this.chatRepository.findAllByUserId(userId);
  }
}
