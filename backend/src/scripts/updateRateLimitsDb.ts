import mongoose from "mongoose";
import { MongoRateLimit } from "../infrastructure/auth/models/MongoRateLimitModel";
import { DAILY_COUNT_LIMITS, UPLOAD_SIZE_LIMITS, MODEL_TOKEN_LIMITS, DEFAULT_MODEL_TOKEN_LIMITS } from "../constants/rateLimits";
import dotenv from "dotenv";
import { Redis } from "ioredis";

dotenv.config();

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dentrites";
  console.log("Connecting to MongoDB at:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB successfully.");

  console.log("Updating daily_count_limits in MongoDB...");
  const result = await MongoRateLimit.findOneAndUpdate(
    { key: "daily_count_limits" },
    { value: DAILY_COUNT_LIMITS },
    { upsert: true, new: true }
  );
  console.log("Updated daily_count_limits.");

  console.log("Updating upload_size_limits in MongoDB...");
  const sizeResult = await MongoRateLimit.findOneAndUpdate(
    { key: "upload_size_limits" },
    { value: UPLOAD_SIZE_LIMITS },
    { upsert: true, new: true }
  );
  console.log("Updated upload_size_limits.");

  console.log("Updating model_token_limits in MongoDB...");
  await MongoRateLimit.findOneAndUpdate(
    { key: "model_token_limits" },
    { value: MODEL_TOKEN_LIMITS },
    { upsert: true, new: true }
  );
  console.log("Updated model_token_limits.");

  console.log("Updating default_model_token_limits in MongoDB...");
  await MongoRateLimit.findOneAndUpdate(
    { key: "default_model_token_limits" },
    { value: DEFAULT_MODEL_TOKEN_LIMITS },
    { upsert: true, new: true }
  );
  console.log("Updated default_model_token_limits.");

  // Invalidate Redis cache key
  const redisUri = process.env.REDIS_URL || "redis://localhost:6379";
  console.log("Connecting to Redis at:", redisUri);
  const redis = new Redis(redisUri);
  await redis.del("config:daily_count_limits");
  await redis.del("config:upload_size_limits");
  await redis.del("config:model_token_limits");
  await redis.del("config:default_model_token_limits");
  console.log("Cleared Redis cache for keys.");
  await redis.quit();

  await mongoose.disconnect();
  console.log("Database disconnected. Migration finished successfully!");
}

run().catch(err => {
  console.error("Migration failed with error:", err);
  process.exit(1);
});
