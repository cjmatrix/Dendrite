import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IMessageRepository } from '../../../domain/chat/repositories/IMessageRepository';
import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';
import { AppError } from '../../../utils/AppError';

export class GetChatMessages {
  constructor(
    private chatRepository: IChatRepository,
    private messageRepository: IMessageRepository,
    private subChatRepository: ISubChatRepository
  ) {}

  async execute(chatId: string, userId: string, limit: number, cursor: string | null) {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found or unauthorized", 404);
    }

    const messages = await this.messageRepository.findMessages({ chatId }, limit, cursor);

    const messageIds = messages.map(m => m._id);
    const subChats = await this.subChatRepository.findByAnchorMessageIdsAndChatId(messageIds, chatId);

    const subChatMap = new Map<string, any[]>();
    subChats.forEach(sc => {
      const key = sc.anchorMessageId.toString();
      if (!subChatMap.has(key)) {
        subChatMap.set(key, []);
      }
      subChatMap.get(key)!.push({
        subChatId: sc._id,
        relY: sc.relativeY ?? 0
      });
    });

    const messagesWithFlags = messages.map(m => {
      const subChatsForMsg = subChatMap.get(m._id.toString()) || [];
      return {
        ...m,
        hasSubChat: subChatsForMsg.length > 0,
        subChats: subChatsForMsg
      };
    });

    messagesWithFlags.reverse();

    return messagesWithFlags;
  }
}
