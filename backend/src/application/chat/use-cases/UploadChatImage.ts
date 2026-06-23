import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IUploadChatImageUseCase } from './interfaces';
import { UploadChatImageInputDTO, UploadChatImageOutputDTO } from '../dtos/chat.dto';
import { IFileStorageService } from '../../common/ports/IFileStorageService';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';
import { IRateLimitService } from '../../common/ports/IRateLimitService';

@injectable()
export class UploadChatImage implements IUploadChatImageUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IFileStorageService") private fileStorageService: IFileStorageService,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService,
  ) {}

  async execute(input: UploadChatImageInputDTO): Promise<UploadChatImageOutputDTO> {
    const { userId, chatId, file } = input;

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found or access denied", 404);
    }

    const result = await this.fileStorageService.uploadImage(
      file.buffer,
      file.mimetype,
    );

    try {
      await this.rateLimitService.incrementCount(userId, "imageUploads");
    } catch (err) {
      console.error("Failed to increment imageUploads rate limit counter", err);
    }

    return { url: result.url };
  }
}
