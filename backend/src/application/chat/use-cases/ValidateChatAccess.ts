import { injectable, inject } from "tsyringe";
import { IValidateChatAccessUseCase } from "./interfaces";
import { ValidateChatAccessInputDTO, ChatOutputDTO, ChatMapper } from "../dtos/chat.dto";
import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { AppError } from "../../../utils/AppError";

@injectable()
export class ValidateChatAccess implements IValidateChatAccessUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository
  ) {}

  async execute(input: ValidateChatAccessInputDTO): Promise<ChatOutputDTO> {
    const chat = await this.chatRepository.findByIdAndUserId(input.chatId, input.userId);
    if (!chat) {
      throw new AppError("Chat not found or unauthorized", 404);
    }
    return ChatMapper.toChatOutput(chat);
  }
}
