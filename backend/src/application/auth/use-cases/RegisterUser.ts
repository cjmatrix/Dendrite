import mongoose from 'mongoose';
import { IUserRepository } from '../../../domain/auth/repositories/IUserRepository';
import { Folder } from '../../../models/Folders';
import { generateAccessToken, generateRefreshToken } from '../../../utils/tokenUtils';
import { AppError } from '../../../utils/AppError';

export class RegisterUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(userData: any) {
    const { name, email, password } = userData;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await this.userRepository.create({
        name,
        email,
        password
      });

      await this.userRepository.save(user, session);

      const systemFolders = [
        { userId: user._id, parentId: null, name: "Documents", isSystemFolder: true },
        { userId: user._id, parentId: null, name: "Media", isSystemFolder: true },
        { userId: user._id, parentId: null, name: "Research", isSystemFolder: true },
        { userId: user._id, parentId: null, name: "Chats", isSystemFolder: true }
      ];

      await Folder.insertMany(systemFolders, { session });

      const accessToken = generateAccessToken(user._id.toString());
      const refreshToken = generateRefreshToken(user._id.toString());

      user.refreshTokens.push(refreshToken);
      await this.userRepository.save(user, session);

      await session.commitTransaction();
      session.endSession();

      const { password: _pw, refreshTokens: _rt, ...safeUser } = user.toObject();
      return { user: safeUser, accessToken, refreshToken };
      
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}
