import mongoose from "mongoose";
const { Schema } = mongoose;

const ContentHashSchema = new Schema(
  {
    contentHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active",
    },
    expireAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ContentHash = mongoose.model("ContentHash", ContentHashSchema);
