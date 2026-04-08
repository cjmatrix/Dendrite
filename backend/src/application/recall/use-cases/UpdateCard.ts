import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { AppError } from '../../../utils/AppError';
import { scheduleRecallNotification } from '../../../queue/recallQueue';

const steps = [1, 10, 30]; 

export class UpdateCard {
  constructor(private recallRepository: IRecallRepository) {}

  async execute(userId: string, cardId: string, rating: number) {
    const card = await this.recallRepository.findByIdAndUserId(cardId, userId);
    if (!card) {
      throw new AppError("No card", 400);
    }

    const now = new Date();

    if (card.stage === "learning") {
      if (rating >= 3) {
        if (card.stepIndex < steps.length - 1) {
          card.stepIndex++;
          card.nextReview = new Date(now.getTime() + steps[card.stepIndex] * 60000);
        } else {
          card.stage = "review";
          card.repetitions = 1;
          card.interval = 1;
          card.nextReview = new Date(now.getTime() + 86400000);
        }
      } else {
        card.stepIndex = 0;
        card.nextReview = new Date(now.getTime() + 60000);
      }
    } 
    // REVIEW PHASE (SM2)
    else {
      if (rating < 3) {
        card.stage = "learning";
        card.stepIndex = 0;
        card.nextReview = new Date(now.getTime() + 60000);
      } else {
        card.easeFactor =
          card.easeFactor +
          (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

        if (card.easeFactor < 1.3) card.easeFactor = 1.3;

        if (card.repetitions === 1) card.interval = 1;
        else if (card.repetitions === 2) card.interval = 6;
        else card.interval = Math.round(card.interval * card.easeFactor);

        card.repetitions++;
        card.nextReview = new Date(now.getTime() + card.interval * 86400000);
      }
    }

    const delayInMs = Math.max(0, card.nextReview.getTime() - Date.now());
    const newJobId = await scheduleRecallNotification(userId, card._id.toString(), delayInMs, card.jobId);
    
    if (newJobId) {
      card.jobId = newJobId;
    }

    await this.recallRepository.save(card);
    return card;
  }
}
