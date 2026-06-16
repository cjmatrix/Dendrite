import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IRecallPublisher } from '../../common/ports/IRecallPublisher';
import { IDeleteCardUseCase } from "./interfaces";

@injectable()
export class DeleteCard implements IDeleteCardUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository,
    @inject("IRecallPublisher") private recallPublisher: IRecallPublisher
  ) {}

  async execute(userId: string, cardId: string) {
    const card = await this.recallRepository.findByIdAndUserId(cardId, userId);
    if (card && card.jobId) {
      try {
        await this.recallPublisher.cancel(card.jobId);
      } catch (error) {
        console.log(`Failed to remove job ${card.jobId} from queue`, error);
      }
    }
    return await this.recallRepository.deleteByCardIdAndUserId(cardId, userId);
  }
}
