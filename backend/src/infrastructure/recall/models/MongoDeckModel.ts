import mongoose from "mongoose";

const DeckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  color: {
    type: String,
    default: "#8b5cf6",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

DeckSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model("Deck", DeckSchema);
