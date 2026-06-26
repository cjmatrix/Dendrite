import mongoose, { Schema, Document } from "mongoose";

export interface IRateLimitDocument extends Document {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

const RateLimitSchema = new Schema<IRateLimitDocument>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
  }
);

export const MongoRateLimit = mongoose.model<IRateLimitDocument>(
  "RateLimit",
  RateLimitSchema
);
