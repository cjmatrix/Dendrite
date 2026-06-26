import mongoose, { Schema, Document } from "mongoose";
import { IDailyTokenUsage } from "../../../domain/usage/entities/DailyTokenUsage";

const DailyTokenUsageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    tierAtTime: { type: String, required: true },
    token_usage: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

DailyTokenUsageSchema.index({ date: 1, userId: 1 }, { unique: true });

export const DailyTokenUsage = mongoose.model<IDailyTokenUsage & Document>("DailyTokenUsage", DailyTokenUsageSchema);
