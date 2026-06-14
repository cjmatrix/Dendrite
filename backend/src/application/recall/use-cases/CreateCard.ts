import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IRecallPublisher } from '../../common/ports/IRecallPublisher';

@injectable()
export class CreateCard {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository,
    @inject("IRecallPublisher") private recallPublisher: IRecallPublisher
  ) {}

  async execute(userId: string, content: string, chatId: string) {
    const nextReview = new Date(Date.now() + 5000); 

    
    const recall = await this.recallRepository.create({
      userId,
      chatId,
      content,
      nextReview,
    });

    const delayInMs = recall.nextReview.getTime() - Date.now();
    const jobId = await this.recallPublisher.publish(userId, recall._id.toString(), delayInMs);
    
    if (jobId) {
      recall.jobId = jobId;
      await this.recallRepository.save(recall);
    }

    return recall;
  }
}
