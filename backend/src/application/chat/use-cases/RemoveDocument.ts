import { IChatRepository } from '../../../domain/chat/repositories/IChatRepository';
import { IVectorRepository } from '../../../domain/vector/repositories/IVectorRepository';
import { IRemoveDocumentUseCase } from './interfaces';
import { RemoveDocumentInputDTO } from '../dtos/chat.dto';
import { AppError } from '../../../utils/AppError';
import { injectable, inject } from 'tsyringe';

@injectable()
export class RemoveDocument implements IRemoveDocumentUseCase {
  constructor(
    @inject("IChatRepository") private chatRepository: IChatRepository,
    @inject("IVectorRepository") private vectorRepository: IVectorRepository
  ) {}

  async execute(input: RemoveDocumentInputDTO): Promise<{ message: string }> {
    const { userId, chatId, fileUrl } = input;

    await this.vectorRepository.deleteDocumentVectorsByFileUrl(userId, fileUrl);

    const chat = await this.chatRepository.findByIdAndUserId(chatId, userId);
    if (!chat) {
      throw new AppError("Chat not found", 404);
    }

    const updateResult = await this.chatRepository.update(chatId, userId, {
      $pull: { documents: { fileUrl } },
    });
    if (!updateResult) {
      throw new AppError("Chat not found", 404);
    }

    return { message: "Document removed successfully" };
  }
}
