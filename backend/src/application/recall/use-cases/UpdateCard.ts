import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { AppError } from '../../../utils/AppError';
import { IRecallPublisher } from '../../common/ports/IRecallPublisher';
import { IUpdateCardUseCase } from "./interfaces";


const steps = [1, 10, 30];

@injectable()
export class UpdateCard implements IUpdateCardUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository,
    @inject("IRecallPublisher") private recallPublisher: IRecallPublisher
  ) {}

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
          card.nextReview = new Date(now.getTime() + 86400000); // 1 day
        }
      } else {
     
        card.stepIndex = 0;
        card.nextReview = new Date(now.getTime() + steps[0] * 60000); 
      }
    }
    // REVIEW PHASE (SM2)
    else {
      if (rating === 1) {
      
        card.easeFactor = Math.max(1.3, card.easeFactor - 0.20);
        card.stage = "learning";
        card.stepIndex = 0;
        card.repetitions = 0;
        card.interval = 0;
        card.nextReview = new Date(now.getTime() + steps[0] * 60000); 

      } else if (rating === 2) {
       
        card.easeFactor = Math.max(1.3, card.easeFactor - 0.15);
        card.interval = Math.max(1, Math.round(card.interval * 0.35));
        card.repetitions++;
        card.nextReview = new Date(now.getTime() + card.interval * 86400000);

      } else {
       
        if (rating === 3) {
          
          card.easeFactor = Math.max(1.3, card.easeFactor - 0.14);
        } else if (rating === 4) {
          
        } else if (rating === 5) {
   
          card.easeFactor = Math.min(3.0, card.easeFactor + 0.15);
        }

    
        let newInterval: number;
        if (card.repetitions === 1) {
        
          newInterval = rating === 5 ? 4 : 1;
        } else if (card.repetitions === 2) {
         
          newInterval = rating === 5 ? 10 : 6;
        } else {
          if (rating === 3) {
            newInterval = Math.max(1, Math.round(card.interval * 0.75));
          } else {
            const base = Math.round(card.interval * card.easeFactor);
            newInterval = rating === 5 ? Math.round(base * 1.3) : base;
          }
        }

        card.interval = newInterval;
        card.repetitions++;
        card.nextReview = new Date(now.getTime() + card.interval * 86400000);
      }
    }

    const delayInMs = Math.max(0, card.nextReview.getTime() - Date.now());
    const newJobId = await this.recallPublisher.publish(
      userId,
      card._id.toString(),
      delayInMs,
      card.jobId
    );
    
    if (newJobId) {
      card.jobId = newJobId;
    }

    await this.recallRepository.save(card);
    return card;
  }
}
