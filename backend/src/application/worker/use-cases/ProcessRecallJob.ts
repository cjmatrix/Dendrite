import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import admin from '../../../config/firebase';
import { ILogger } from '../../common/ports/ILogger';

@injectable()
export class ProcessRecallJob {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository,
    @inject("IUserRepository") private userRepository: IUserRepository,
    @inject("ILogger") private logger: ILogger
  ) {}

  async execute(userId: string, cardId: string) {
    try {
      const recall = await this.recallRepository.findByIdAndUserId(cardId, userId);

      const now = new Date();
      if (!recall || recall.nextReview > now) {
        this.logger.warn(`Recall ${cardId} is no longer due or was deleted.`);
        return;
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user || !user.fcmToken || user.fcmToken.length === 0) {
        this.logger.warn(`User ${userId} has no FCM token. Notification skipped.`);
        return;
      }

      const message = {
        notification: {
          title: "Time for Active Recall!",
          body: "You have a card ready for review. Keep your brain sharp! 🧠",
        },
        tokens: user.fcmToken,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.info(`Successfully sent recall notification to User: ${userId}`);
      
    } catch (error: any) {
      this.logger.error(`Failed to process recall notification for ${cardId}`, error);
      throw error; 
    }
  }
}
