import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IRecallPublisher } from '../../common/ports/IRecallPublisher';
import { IClearAllCardsUseCase } from "./interfaces";

@injectable()
export class ClearAllCards implements IClearAllCardsUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository,
    @inject("IRecallPublisher") private recallPublisher: IRecallPublisher
  ) {}

  async execute(userId: string) {
    const cards = await this.recallRepository.findAllByUserId(userId);
    for (const card of cards) {
      if (card.jobId) {
        try {
          await this.recallPublisher.cancel(card.jobId);
        } catch (error) {
          console.log(`Failed to remove job ${card.jobId} from queue`, error);
        }
      }
    }
    return await this.recallRepository.deleteAllByUserId(userId);
  }
}
