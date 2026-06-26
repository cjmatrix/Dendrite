import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';
import { ISaveSubChatUseCase } from './interfaces';
import { SaveSubChatInputDTO } from '../dtos/chat.dto';
import { injectable, inject } from 'tsyringe';
import { IMessage } from '../../../domain/chat/entities/Message';
import { ISubChat } from '../../../domain/chat/entities/SubChat';

@injectable()
export class SaveSubChat implements ISaveSubChatUseCase {
  constructor(@inject("ISubChatRepository") private subChatRepository: ISubChatRepository) {}

  async execute(input: SaveSubChatInputDTO): Promise<ISubChat> {
    const { chatId, userId, subChatId, anchorMessageId, highlightedText, messages, relativeY } = input;

    const sanitizedMessages = messages.map((msg: IMessage) => {
      if (msg._id && typeof msg._id === "string" && msg._id.startsWith("temp-")) {
        const { _id, ...cleanMessage } = msg;
        return cleanMessage as IMessage;
      }
      return msg;
    });

    let subChat: ISubChat | null = null;
    if (subChatId) {
      subChat = await this.subChatRepository.update(
        subChatId,
        userId,
        {
          highlightedText,
          messages: sanitizedMessages,
          relativeY,
        }
      );
    } else {
      subChat = await this.subChatRepository.create({
        chatId,
        anchorMessageId,
        userId,
        highlightedText,
        messages: sanitizedMessages,
        relativeY,
      });
    }

    if (!subChat) {
      throw new Error("Failed to save subChat");
    }

    return subChat;
  }
}
