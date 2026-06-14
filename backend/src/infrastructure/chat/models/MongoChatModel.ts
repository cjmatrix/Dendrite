import mongoose from "mongoose";
const { Schema } = mongoose;

const ChatSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

    title: {
      type: String,
      default: "New Research Chat",
      trim: true,
    },

    contextParent: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      default: null,
      index: true,
    },

    summary: {
      type: String,
      default: null,
    },

    tokenCount: {
      type: Number,
      default: 0,
    },

    unsummarizedCount: {
      type: Number,
      default: 0,
    },

    documents: [
      {
        type: Schema.Types.ObjectId,
        ref: "UploadedDocument",
      },
    ],
  },
  {
    timestamps: true,
  },
);

ChatSchema.index({ userId: 1, folderId: 1 });

export const Chat = mongoose.model("Chat", ChatSchema);
