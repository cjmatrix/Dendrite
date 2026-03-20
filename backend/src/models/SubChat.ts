import mongoose from "mongoose";
const { Schema } = mongoose;

const SubChatSchema = new Schema(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    anchorMessageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    highlightedText: {
      type: String,
      required: true,
    },
    relativeY: {  
      type: Number,
      default: 0,
    },
    messages: [
      {
        role: { type: String, enum: ["user", "model"], required: true },
        content: { type: String, required: true },
        _id: { type: Schema.Types.ObjectId, auto: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Each message highlight can have only one Pinned/Sticky subchat
// SubChatSchema.index({ chatId: 1});

export const SubChat = mongoose.model("SubChat", SubChatSchema);
