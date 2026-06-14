import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IUploadChatImageUseCase } from './interfaces';
import { UploadChatImageInputDTO, UploadChatImageOutputDTO } from '../dtos/chat.dto';
import { IFileStorageService } from '../../common/ports/IFileStorageService';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class UploadChatImage implements IUploadChatImageUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IFileStorageService") private fileStorageService: IFileStorageService,
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

    return { url: result.url };
  }
}
