import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IUploadChatImageUseCase } from './interfaces';
import { UploadChatImageInputDTO, UploadChatImageOutputDTO } from '../dtos/chat.dto';
import { FileUploadService } from '../../../services/FileUploadService';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class UploadChatImage implements IUploadChatImageUseCase {
  constructor(@inject("IChatRepository") private chatRepository: IChatRepository) {}

  async execute(input: UploadChatImageInputDTO): Promise<UploadChatImageOutputDTO> {
    const { userId, chatId, file } = input;

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found or access denied", 404);
    }

    FileUploadService.validateCloudinaryConfig();
    await FileUploadService.validateImageFile(file.buffer);

    const result = await FileUploadService.uploadImageToCloudinary(
      file.buffer,
      file.mimetype,
    );

    return { url: result.secure_url };
  }
}
