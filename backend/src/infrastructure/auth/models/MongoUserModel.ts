import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, IByokKey, IFeatureUsage, IGlobalProfile, ITokenCategory, ITokenUsage } from "../../../domain/auth/entities/User";

export interface IMongoUserDocument extends Omit<IUser, "_id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IMongoUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    avatarUrl: { type: String, default: "" },

    role: {
      type: String,
      default: "user",
      enum: ["admin", "user"],
    },
    status: {
      type: String,
      enum: ["pending", "active", "banned", "suspended"],
      default: "pending",
    },
    tier: {
      type: String,
      enum: ["free", "pro", "enterprise","byok"],
      default: "free",
    },
    tokensUsed: { type: Number, default: 0 },

    settings: {
      global: { type: Boolean, default: true },
      inline: { type: Boolean, default: true },
      diagram: { type: Boolean, default: true },
      saveHistory: { type: Boolean, default: true },
    },
    fcmToken: {
      type: [String],
      default: [],
    },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    billingProvider: { type: String, enum: ["stripe", "paddle"], default: null },
    billingCustomerId: { type: String, default: null },
    billingSubscriptionId: { type: String, default: null },

    byok_keys: [
      {
        provider: { type: String, required: true, enum: ["gemini", "groq"] },
        encryptedKeys: { type: [String], required: true },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    featureUsage: {
      visuals: { type: Number, default: 0 },
      quickChats: { type: Number, default: 0 },
    },

    globalProfile: {
      user_name: { type: String, default: null, trim: true },
      location: { type: String, default: null, trim: true },
      role: { type: String, default: null, trim: true },
      tech_stack: { type: [String], default: [] },
      expertise_level: { type: String, default:"beginner", trim: true },
      environment: { type: [String], default: [] },
      user_preferences: { type: [String], default: [] },
      response_style: { type: String, default: null, trim: true },
      current_projects: { type: [String], default: [] },
      long_term_goals: { type: [String], default: [] },
      constraints: { type: [String], default: [] },
      entities: { type: [String], default: [] },
    },

    token_usage: {
      google: {
        mainChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        chatSummary: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        codeDescription: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        p5Visualization: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        quickChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      },
      anthropic: {
        mainChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        chatSummary: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        codeDescription: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        p5Visualization: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        quickChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      },
      openai: {
        mainChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        chatSummary: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        codeDescription: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        p5Visualization: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        quickChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      },
      openrouter: {
        mainChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        chatSummary: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        codeDescription: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        p5Visualization: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        quickChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      },
      groq: {
        mainChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        chatSummary: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        codeDescription: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        p5Visualization: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        quickChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      },
      mistral: {
        mainChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        chatSummary: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        codeDescription: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        p5Visualization: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
        quickChat: { input: { type: Number, default: 0 }, output: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      },
      lastResetDate: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password as string);
};

export const User: Model<IMongoUserDocument> =
  mongoose.model<IMongoUserDocument>("User", UserSchema);
