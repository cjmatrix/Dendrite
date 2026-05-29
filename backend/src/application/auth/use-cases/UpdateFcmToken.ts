import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { AppError } from '../../../utils/AppError';
import { UpdateFcmTokenInputDTO } from '../dtos/auth.dto';
import { injectable, inject } from "tsyringe";
import { IUpdateFcmTokenUseCase } from "./interfaces";

@injectable()
export class UpdateFcmToken implements IUpdateFcmTokenUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(data: UpdateFcmTokenInputDTO): Promise<{ success: boolean; message: string }> {
    const { userId, fcmToken } = data;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.fcmToken.includes(fcmToken)) {
      user.fcmToken.push(fcmToken);
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
