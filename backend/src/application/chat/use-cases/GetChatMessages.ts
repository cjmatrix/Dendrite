import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IMessageRepository } from '../../../domain/chat/repositories/IMessageRepository';
import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';
import { IGetChatMessagesUseCase } from './interfaces';
import { GetChatMessagesInputDTO, GetChatMessagesOutputDTO } from '../dtos/chat.dto';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class GetChatMessages implements IGetChatMessagesUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("ISubChatRepository") private subChatRepository: ISubChatRepository
  ) {}

  async execute(input: GetChatMessagesInputDTO): Promise<GetChatMessagesOutputDTO> {
    const { chatId, userId, limit, cursor } = input;

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found or unauthorized", 404);
    }

    const messages = await this.messageRepository.findMessages({ chatId }, limit, cursor);

    const messageIds = messages.map(m => m._id);
    const subChats = await this.subChatRepository.findByAnchorMessageIdsAndChatId(messageIds, chatId,userId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subChatMap = new Map<string, any[]>();
    subChats.forEach(sc => {
      const key = sc.anchorMessageId.toString();
      if (!subChatMap.has(key)) {
        subChatMap.set(key, []);
      }
      subChatMap.get(key)!.push({
        subChatId: sc._id,
        relY: sc.relativeY ?? 0,
        highlightedText: sc.highlightedText
      });
    });

    const messagesWithFlags = messages.map(m => {
      const subChatsForMsg = subChatMap.get(m._id.toString()) || [];
      return {
        ...m,
        id: m._id.toString(),
        hasSubChat: subChatsForMsg.length > 0,
        subChats: subChatsForMsg
      };
    });

    messagesWithFlags.reverse();

    const nextCursor = messages.length === limit ? messages[messages.length - 1]._id.toString() : null;

    return { messages: messagesWithFlags, nextCursor };
  }
}
