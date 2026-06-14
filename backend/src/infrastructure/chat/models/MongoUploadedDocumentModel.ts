import mongoose from "mongoose";
const { Schema } = mongoose;

const UploadedDocumentSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileType: {
      type: String,
      enum: ["image", "document"],
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    extension: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    contentHash: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const UploadedDocument = mongoose.model("UploadedDocument", UploadedDocumentSchema);
