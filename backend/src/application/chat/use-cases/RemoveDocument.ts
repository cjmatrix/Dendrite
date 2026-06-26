import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IUploadedDocumentRepository } from '../../../domain/chat/repositories/IUploadedDocumentRepository';
import { IContentHashRepository } from '../../../domain/chat/repositories/IContentHashRepository';
import { IRemoveDocumentUseCase } from './interfaces';
import { RemoveDocumentInputDTO } from '../dtos/chat.dto';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class RemoveDocument implements IRemoveDocumentUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IUploadedDocumentRepository") private uploadedDocumentRepository: IUploadedDocumentRepository,
    @inject("IContentHashRepository") private contentHashRepository: IContentHashRepository,
  ) {}

  async execute(input: RemoveDocumentInputDTO): Promise<{ message: string }> {
    const { userId, chatId, fileUrl } = input;

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    const uploadedDoc = await this.uploadedDocumentRepository.findByChatIdAndFileUrl(chatId, fileUrl);
    if (!uploadedDoc) {
      throw new AppError("Document not found in this chat", 404);
    }

    
    const updateResult = await this.chatRepository.update(chatId, userId, {
      $pull: { documents: uploadedDoc._id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    if (!updateResult) {
      throw new AppError("Chat not found", 404);
    }


    await this.uploadedDocumentRepository.delete(uploadedDoc._id);

   console.log("[Deleted] Deleted document")
    const count = await this.uploadedDocumentRepository.countByContentHash(uploadedDoc.contentHash);
    if (count === 0) {
      const hashRecord = await this.contentHashRepository.findByHash(uploadedDoc.contentHash);
      if (hashRecord) {
        hashRecord.status = "expired";
        hashRecord.expireAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
        await this.contentHashRepository.save(hashRecord);
      }
    }

    return { message: "Document removed successfully" };
  }
}
