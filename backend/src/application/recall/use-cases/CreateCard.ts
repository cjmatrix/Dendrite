import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { scheduleRecallNotification } from '../../../queue/recallQueue';

export class CreateCard {
  constructor(private recallRepository: IRecallRepository) {}

  async execute(userId: string, content: string, chatId: string) {
    const nextReview = new Date(Date.now() + 60000); // 1 minute default (5 seconds effectively for demo?)

    
    const recall = await this.recallRepository.create({
      userId,
      chatId,
      content,
      nextReview,
    });

    const delayInMs = recall.nextReview.getTime() - Date.now();
    const jobId = await scheduleRecallNotification(userId, recall._id.toString(), delayInMs);
    
    if (jobId) {
      recall.jobId = jobId;
      await this.recallRepository.save(recall);
    }

    return recall;
  }
}
