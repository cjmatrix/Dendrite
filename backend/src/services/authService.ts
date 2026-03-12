import mongoose from 'mongoose';
import { User } from '../models/User';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/tokenUtils';
import { AppError } from '../utils/AppError';
import { Folder } from '../models/Folders';

export const AuthService = {
  async register(userData: any) {
    const { name, email, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User already exists', 409);
    }

    // Start a MongoDB session for atomic transactions
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = new User({
        name,
        email,
        password
      });

      await user.save({ session });

      // Create system folders concurrently using the same transaction session
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
      await user.save({ session });

      // Commit the transaction only if every database step was perfectly successful
      await session.commitTransaction();
      session.endSession();

      const { password: _pw, refreshTokens: _rt, ...safeUser } = user.toObject();
      return { user: safeUser, accessToken, refreshToken };
      
    } catch (error) {
      // If anything fails (User save, Folder creation, etc.), abort the transaction safely!
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  },

  async login(userData: any) {
    const { email, password } = userData;
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    user.refreshTokens.push(refreshToken);
    await user.save();

    const { password: _, refreshTokens: __, ...safeUser } = user.toObject();
    return { user: safeUser, accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    let decoded: any;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new AppError('Invalid refresh token', 403);
    }

    const user = await User.findById(decoded.userId);

    // Token Rotation: Check if token exists in DB, if not, it means compromised
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      if (user) {
        // Compromised token detected, clear all tokens to re-login user
        await User.findByIdAndUpdate(user._id, { $set: { refreshTokens: [] } });
      }
      throw new AppError('Compromised Token', 403);
    }

    const newAccessToken = generateAccessToken(user._id.toString());
    const newRefreshToken = generateRefreshToken(user._id.toString());

    // Replace old with new token
    await User.updateOne(
      { _id: user._id, refreshTokens: refreshToken },
      { $set: { "refreshTokens.$": newRefreshToken } }
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    try {
      const decoded: any = verifyRefreshToken(refreshToken);
      if (decoded && decoded.userId) {
        await User.findByIdAndUpdate(decoded.userId, {
          $pull: { refreshTokens: refreshToken }
        });
      }
    } catch(err) {
       // Ignore verification error on logout
    }
  },

  async getMe(userId: string) {
    const user = await User.findById(userId).select('-password -refreshTokens');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }
};
