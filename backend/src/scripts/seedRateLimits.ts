import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { MongoRateLimit } from "../infrastructure/auth/models/MongoRateLimitModel";
import { redisConnection } from "../config/redis";
import { MODEL_TOKEN_LIMITS } from "../constants/rateLimits";

async function runSeed() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dentrites";
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  // Fetch existing model_token_limits configuration
  let doc = await MongoRateLimit.findOne({ key: "model_token_limits" });

  const newModelLimits = {
    "gemini-3.1-flash-lite": {
      free: 300_000,
      pro: 1_500_000,
      enterprise: 8_000_000,
      byok: -1,
    },
    "gemini-3.5-flash": {
      free: 200_000,
      pro: 1_000_000,
      enterprise: 5_000_000,
      byok: -1,
    }
  };

  if (!doc) {
    console.log("No existing 'model_token_limits' document found. Creating one with default limits...");
    // Initialize with MODEL_TOKEN_LIMITS merged with our new models
    const initialValue = {
      ...MODEL_TOKEN_LIMITS,
      ...newModelLimits,
    };
    doc = new MongoRateLimit({
      key: "model_token_limits",
      value: initialValue,
    });
    await doc.save();
    console.log("Created 'model_token_limits' document.");
  } else {
    console.log("Found existing 'model_token_limits' document. Merging new models...");
    // Merge new limits into the existing document
    const currentValue = (doc.value || {}) as Record<string, unknown>;
    const updatedValue = {
      ...currentValue,
      ...newModelLimits,
    };
    doc.value = updatedValue;
    doc.markModified("value");
    await doc.save();
    console.log("Merged and saved 'model_token_limits' document.");
  }

  // Clear Redis Cache
  console.log("Invalidating Redis cache key 'config:model_token_limits'...");
  await redisConnection.del("config:model_token_limits");
  console.log("Redis cache key invalidated.");

  // Close connections
  await mongoose.disconnect();
  redisConnection.disconnect();
  console.log("Database and Redis connections closed. Seeding complete!");
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
