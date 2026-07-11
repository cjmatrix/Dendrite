import mongoose from "mongoose";

const RecallSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    breadCrumbs:{
        type:[String],
        default:[]
    },
  content: {
    type: String,
    required: true,
  },

  question: {
    type: String,
  },


  stage: {
    type: String,
    enum: ["learning", "review"],
    default: "learning",
  },
 
  stepIndex: {
    type: Number,
    default: 0,
  },

  repetitions: {
    type: Number,
    default: 0,
  },

  interval: {
    type: Number,
    default: 0, 
  },

  easeFactor: {
    type: Number,
    default: 2.5,
  },

 
  nextReview: {
    type: Date,
    required: true,
    index: true, 
  },


  jobId: {
    type: String,
  },


  lastReviewed: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Recall", RecallSchema);