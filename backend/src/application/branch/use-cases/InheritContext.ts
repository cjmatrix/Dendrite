import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { AppError } from '../../../utils/AppError';

export class InheritContext {
  constructor(private chatRepository: IChatRepository) {}

  async execute(chatId: string, userId: string, contextParentId: string) {
   
    if (!chatId || !contextParentId) {
      throw new AppError("Missing chat ID or parent ID", 400);
    }

 
    if (chatId === contextParentId) {
      throw new AppError("A chat cannot inherit context from itself", 400);
    }

   
    const updatedChat = await this.chatRepository.update(chatId, userId, { 
      contextParent: contextParentId 
    });

    
    if (!updatedChat) {
      throw new AppError("Chat not found or unauthorized", 404);
    }

    return updatedChat;
  }
}
