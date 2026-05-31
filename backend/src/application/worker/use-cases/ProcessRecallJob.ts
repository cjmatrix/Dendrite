import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import admin from '../../../config/firebase';

@injectable()
export class ProcessRecallJob {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository,
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(userId: string, cardId: string) {
    try {
      const recall = await this.recallRepository.findByIdAndUserId(cardId, userId);

      const now = new Date();
      if (!recall || recall.nextReview > now) {
        console.log(`Recall ${cardId} is no longer due or was deleted.`);
        return;
      }

      const user = await this.userRepository.findById(userId);
      
      if (!user || !user.fcmToken || user.fcmToken.length === 0) {
        console.log(`User ${userId} has no FCM token. Notification skipped.`);
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
      console.log(`Successfully sent recall notification to User: ${userId}`);
      
    } catch (error: any) {
      console.log(`Failed to process recall notification for ${cardId}:`, error.message);
      throw error; 
    }
  }
}
