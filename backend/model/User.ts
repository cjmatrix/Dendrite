import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  tier: 'free' | 'pro' | 'enterprise';
  tokensUsed: number;
  settings: {
    theme: 'light' | 'dark' | 'system';
    defaultModel: string;
    saveHistory: boolean;
  };
  refreshTokens: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, 
  avatarUrl: { type: String, default: '' },
  
  tier: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
  tokensUsed: { type: Number, default: 0 },
  
  settings: {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'dark' },
    defaultModel: { type: String, default: 'gemini-1.5-pro' },
    saveHistory: { type: Boolean, default: true } 
  },

  refreshTokens: { type: [String], default: [] }
}, { 
  timestamps: true 
});

// Pre-save hook to hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  // Mongoose will automatically catch errors thrown in an async hook and pass them to the next error handler
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};




export const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
