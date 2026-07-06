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
      if (response.failureCount > 0) {
        this.logger.warn(`Failed to send some notifications to User ${userId}. Success: ${response.successCount}, Failed: ${response.failureCount}`);
        
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.warn(`Token ${idx} failed: ${resp.error?.code || resp.error?.message}`);
            if (
              resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(user.fcmToken[idx]);
            }
          }
        });

        if (failedTokens.length > 0) {
          const newTokens = user.fcmToken.filter(t => !failedTokens.includes(t));
          await this.userRepository.findByIdAndUpdate(userId, { fcmToken: newTokens });
          this.logger.info(`Removed ${failedTokens.length} dead FCM tokens for User ${userId}`);
        }
      } else {
        this.logger.info(`Successfully sent recall notification to User: ${userId}. Success: ${response.successCount}`);
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.logger.error(`Failed to process recall notification for ${cardId}`, error);
      throw error; 
    }
  }
}
