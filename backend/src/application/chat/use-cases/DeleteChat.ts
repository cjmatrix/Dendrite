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
import { IUploadedDocumentRepository } from "../../../domain/chat/repositories/IUploadedDocumentRepository";
import { IContentHashRepository } from "../../../domain/chat/repositories/IContentHashRepository";

@injectable()
export class DeleteChat implements IDeleteChatUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository,
    @inject("ISubChatRepository") private subChatRepository: ISubChatRepository,
    @inject("IMessageRepository") private messageRepository: IMessageRepository,
    @inject("ICodeBlockRepository")
    private codeBlockRepository: ICodeBlockRepository,
    @inject("IUploadedDocumentRepository")
    private uploadedDocumentRepository: IUploadedDocumentRepository,
    @inject("IContentHashRepository")
    private contentHashRepository: IContentHashRepository,
    @inject("IUnitOfWorkRepository") private unitOfWork: IUnitOfWorkRepository,
    @inject("ILogger") private logger: ILogger,
  ) {}

  async execute(chatId: string, userId: string): Promise<DeleteChatOutputDTO> {
    await this.unitOfWork.runInTransaction(async () => {
      const chat = await this.chatRepository.delete(chatId, userId);

      if (!chat) {
        throw new AppError("Chat not found", 404);
      }

     
      const uploadedDocs = await this.uploadedDocumentRepository.findByChatId(chatId);
      await this.uploadedDocumentRepository.deleteManyByChatIds([chatId]);


      const uniqueHashes = Array.from(new Set(uploadedDocs.map((d) => d.contentHash)));
      for (const hash of uniqueHashes) {
        const count = await this.uploadedDocumentRepository.countByContentHash(hash);
        if (count === 0) {
          const hashRecord = await this.contentHashRepository.findByHash(hash);
          if (hashRecord) {
            hashRecord.status = "expired";
            hashRecord.expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await this.contentHashRepository.save(hashRecord);
          }
        }
      }

      await Promise.all([
        this.messageRepository.findByIdsAndDelete(chatId, userId),
        this.subChatRepository.deleteByChatId(chatId, userId),
        this.codeBlockRepository.deleteByChatId(chatId, userId),
      ]);
    });

    return { deleted: true };
  }
}
