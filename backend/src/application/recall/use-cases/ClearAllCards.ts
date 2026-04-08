import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { recallQueue } from '../../../queue/recallQueue';

export class ClearAllCards {
  constructor(private recallRepository: IRecallRepository) {}

  async execute(userId: string) {
    const cards = await this.recallRepository.findAllByUserId(userId);
    for (const card of cards) {
      if (card.jobId) {
        try {
          await recallQueue.remove(card.jobId);
        } catch (error) {
          console.log(`Failed to remove job ${card.jobId} from queue`, error);
        }
      }
    }
    return await this.recallRepository.deleteAllByUserId(userId);
  }
}
