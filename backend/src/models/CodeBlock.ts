
import mongoose, { Schema, Document } from "mongoose";

export interface ICodeBlock extends Document {
  userId: mongoose.Types.ObjectId;
  chatId: mongoose.Types.ObjectId;
  code: string;
  language: string;
  description: string;
  createdAt: Date;
}

const codeBlockSchema = new Schema<ICodeBlock>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  chatId: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
  code: { type: String, required: true },
  language: { type: String, default: "text" },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export const CodeBlock = mongoose.model<ICodeBlock>("CodeBlock", codeBlockSchema);
