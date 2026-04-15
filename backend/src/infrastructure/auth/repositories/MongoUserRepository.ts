import { User, IUser } from '../../../models/User';
import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';

export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByIdSafe(id: string): Promise<IUser | null> {
    return User.findById(id).select('-password -refreshTokens');
  }

  async create(userData: any): Promise<IUser> {
    return new User(userData);
  }

  async save(user: IUser, session?: any): Promise<IUser> {
    return user.save({ session });
  }

  async updateRefreshTokens(userId: string, tokens: string[]): Promise<void> {
    await User.findByIdAndUpdate(userId, { $set: { refreshTokens: tokens } });
  }

  async addRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $push: { refreshTokens: token } });
  }

  async replaceRefreshToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    await User.updateOne(
      { _id: userId, refreshTokens: oldToken },
      { $set: { "refreshTokens.$": newToken } }
    );
  }

  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: token }
    });
  }

  async clearRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
  }
}
