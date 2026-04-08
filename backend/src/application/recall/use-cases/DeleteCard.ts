import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { recallQueue } from '../../../queue/recallQueue';

export class DeleteCard {
  constructor(private recallRepository: IRecallRepository) {}

  async execute(userId: string, cardId: string) {
    const card = await this.recallRepository.findByIdAndUserId(cardId, userId);
    if (card && card.jobId) {
      try {
        await recallQueue.remove(card.jobId);
      } catch (error) {
        console.log(`Failed to remove job ${card.jobId} from queue`, error);
      }
    }
    return await this.recallRepository.deleteByCardIdAndUserId(cardId, userId);
  }
}
