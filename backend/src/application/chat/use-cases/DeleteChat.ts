import { IChatRepository } from "../../../domain/chat/repositories/IChatRepository";
import { IVectorRepository } from "../../../domain/vector/repositories/IVectorRepository";
import { IDeleteChatUseCase } from "./interfaces";
import { DeleteChatOutputDTO } from "../dtos/chat.dto";
import { AppError } from "../../../utils/AppError";
import { ILogger } from "../../common/ports/ILogger";
import { injectable, inject } from "tsyringe";
import { ISubChatRepository } from "../../../domain/chat/repositories/ISubChatRepository";
import { IMessageRepository } from "../../../domain/chat/repositories/IMessageRepository";
import { ICodeBlockRepository } from "../../../domain/chat/repositories/ICodeBlockRepository";
import { IUnitOfWorkRepository } from "../../common/ports/IUnitOfWorkRepository";

@injectable()
export class DeleteChat implements IDeleteChatUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("ISubChatRepository") private subChatRepository: ISubChatRepository,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("ICodeBlockRepository")
    private codeBlockRepository: ICodeBlockRepository,
    @inject("IUnitOfWorkRepository") private unitOfWork: IUnitOfWorkRepository,
    @inject("ILogger") private logger: ILogger,
  ) {}

  async execute(chatId: string, userId: string): Promise<DeleteChatOutputDTO> {
    await this.unitOfWork.runInTransaction(async () => {
      const chat = await this.chatRepository.delete(chatId, userId);

      if (!chat) {
        throw new AppError("Chat not found", 404);
      }
      await Promise.all([
        this.messageRepository.findByIdsAndDelete(chatId, userId),
        this.subChatRepository.deleteByChatId(chatId, userId),
        this.codeBlockRepository.deleteByChatId(chatId, userId),
      ]);
    });

    try {
      await this.vectorRepository.deleteVectorsByChatIds(userId, [chatId]);
    } catch (err) {
      this.logger.warn(`Failed to delete vectors for chat`, { chatId, userId, error: err instanceof Error ? err.message : String(err) });
    }

    return { deleted: true };
  }
}
