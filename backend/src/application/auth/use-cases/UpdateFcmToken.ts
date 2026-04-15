import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { AppError } from '../../../utils/AppError';

/**
 * UpdateFcmToken - Use case for updating user's Firebase Cloud Messaging token
 * Handles FCM token storage for push notifications
 */
export class UpdateFcmToken {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string, fcmToken: string): Promise<{ success: boolean; message: string }> {
    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    if (!fcmToken || typeof fcmToken !== 'string') {
      throw new AppError('Valid FCM token is required', 400);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Add token if it doesn't already exist (avoid duplicates)
    if (!user.fcmToken.includes(fcmToken)) {
      user.fcmToken.push(fcmToken);
      // Keep only last 5 tokens to prevent bloat
      if (user.fcmToken.length > 5) {
        user.fcmToken = user.fcmToken.slice(-5);
      }
      await this.userRepository.save(user);
    }

    return {
      success: true,
      message: 'FCM token updated successfully',
    };
  }
}
