import { User } from '../../model/User';

export const AuthService = {
  async registerUser(userData: any) {
    const { name, email, password } = userData;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create user
    const user = new User({
      name,
      email,
      password
    });
    
    await user.save();
    return user;
  },

  async loginUser(email: string) {
    // The password comparison is done in the controller, so we just return the user document
    const user = await User.findOne({ email });
    return user;
  },

  async addRefreshToken(userId: string, refreshToken: string) {
    await User.findByIdAndUpdate(userId, {
      $push: { refreshTokens: refreshToken }
    });
  },

  async removeRefreshToken(userId: string, refreshToken: string) {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken }
    });
  },

  async replaceRefreshToken(userId: string, oldToken: string, newToken: string) {
    await User.updateOne(
      { _id: userId, refreshTokens: oldToken },
      { $set: { "refreshTokens.$": newToken } }
    );
  },

  async clearAllTokens(userId: string) {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] }
    });
  }
};
