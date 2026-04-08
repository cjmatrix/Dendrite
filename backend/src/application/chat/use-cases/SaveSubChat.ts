import { ISubChatRepository } from '../../../domain/chat/repositories/ISubChatRepository';

export class SaveSubChat {
  constructor(private subChatRepository: ISubChatRepository) {}

  async execute(
    chatId: string, 
    userId: string, 
    subChatId: string | undefined, 
    anchorMessageId: string, 
    highlightedText: string, 
    messages: any[], 
    relativeY: number
  ) {
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
