import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';
import { ISaveSubChatUseCase } from './interfaces';
import { SaveSubChatInputDTO } from '../dtos/chat.dto';
import { injectable, inject } from 'tsyringe';

@injectable()
export class SaveSubChat implements ISaveSubChatUseCase {
  constructor(@inject("ISubChatRepository") private subChatRepository: ISubChatRepository) {}

  async execute(input: SaveSubChatInputDTO) {
    const { chatId, userId, subChatId, anchorMessageId, highlightedText, messages, relativeY } = input;

    const sanitizedMessages = messages.map((msg: any) => {
      if (msg._id && typeof msg._id === "string" && msg._id.startsWith("temp-")) {
        const { _id, ...cleanMessage } = msg;
        return cleanMessage;
      }
      return msg;
    });

    let subChat;
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

    return subChat;
  }
}
