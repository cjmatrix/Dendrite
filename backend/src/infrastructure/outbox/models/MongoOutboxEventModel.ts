import mongoose, { Schema, Document } from "mongoose";

export interface IOutboxEvent extends Document {
  eventType: string;
  payload: {
    sourceId: mongoose.Types.ObjectId;
    sourceType: string;
    userId: mongoose.Types.ObjectId;
    content: Record<string, unknown>;
    metadata: Record<string, unknown>;
  };
  status: "pending" | "processed" | "failed";
  retryCount: number;
  processedAt: Date | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const outboxEventSchema = new Schema<IOutboxEvent>(
  {
    eventType: {
      type: String,
      required: true,
      enum: [
        "CODE_BLOCK_CREATED",
        "CODE_BLOCK_DELETED",
        "PDF_CHUNK_CREATED",
        "PDF_CHUNK_DELETED",
        "CHAT_SUMMARY_CREATED",
        "CHAT_SUMMARY_UPDATED",
        "CHAT_STATE_UPDATED"
      ],
    },
    payload: {
      sourceId: { type: Schema.Types.ObjectId, required: true },
      sourceType: {
        type: String,
        required: true,
        enum: ["code_block", "pdf_chunk", "chat_summary","chat_state"],
      },
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      content: { type: Schema.Types.Mixed, required: true },
      metadata: { type: Schema.Types.Mixed, default: {} },
    },
    status: {
      type: String,
      enum: ["pending", "processed", "failed"],
      default: "pending",
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    processedAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true },
);

outboxEventSchema.index({ status: 1, createdAt: 1 });

export const OutboxEvent = mongoose.model<IOutboxEvent>(
  "OutboxEvent",
  outboxEventSchema,
);
