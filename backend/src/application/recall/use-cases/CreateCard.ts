import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IRecallPublisher } from '../../common/ports/IRecallPublisher';
import { ICreateCardUseCase } from "./interfaces";
import { IRateLimitService } from "../../common/ports/IRateLimitService";
import { AIService } from "../../../services/AIService";

@injectable()
export class CreateCard implements ICreateCardUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository,
    @inject("IRecallPublisher") private recallPublisher: IRecallPublisher,
    @inject("IRateLimitService") private rateLimitService: IRateLimitService
  ) {}

  async execute(userId: string, content: string, chatId: string) {
    const nextReview = new Date(Date.now() + 5000);

    
    const question = (await AIService.generateRecallQuestion(content)) ?? undefined;

    const recall = await this.recallRepository.create({
      userId,
      chatId,
      content,
      question,
      nextReview,
    });

    const delayInMs = recall.nextReview.getTime() - Date.now();
    const jobId = await this.recallPublisher.publish(userId, recall._id.toString(), delayInMs);

    if (jobId) {
      recall.jobId = jobId;
      await this.recallRepository.save(recall);
    }

    try {
      await this.rateLimitService.incrementCount(userId, "recallCards");
    } catch (err) {
      console.error("Failed to increment recallCards rate limit counter", err);
    }

    return recall;
  }
}
