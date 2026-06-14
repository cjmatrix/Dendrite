import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IUploadedDocumentRepository } from '../../../domain/chat/repositories/IUploadedDocumentRepository';
import { IGetChatDocumentsUseCase } from './interfaces';
import { ChatDocument } from '../../../domain/chat/entities/Chat';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class GetChatDocuments implements IGetChatDocumentsUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IUploadedDocumentRepository") private uploadedDocumentRepository: IUploadedDocumentRepository,
  ) {}

  async execute(chatId: string, userId: string): Promise<{ documents: ChatDocument[] }> {
    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    const docs = await this.uploadedDocumentRepository.findByChatId(chatId);

    const mapped: ChatDocument[] = docs.map(doc => ({
      _id:doc._id.toString(),
      fileType: doc.fileType,
      filename: doc.filename,
      extension: doc.extension,
      fileUrl: doc.fileUrl,
      uploadedAt: doc.createdAt,
    }));

    return { documents: mapped };
  }
}
