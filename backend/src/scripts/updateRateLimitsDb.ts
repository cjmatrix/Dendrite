import mongoose from "mongoose";
import { MongoRateLimit } from "../infrastructure/auth/models/MongoRateLimitModel";
import { DAILY_COUNT_LIMITS } from "../constants/rateLimits";
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
  console.log("Updated daily_count_limits. New value:", JSON.stringify(result?.value, null, 2));

  // Invalidate Redis cache key
  const redisUri = process.env.REDIS_URL || "redis://localhost:6379";
  console.log("Connecting to Redis at:", redisUri);
  const redis = new Redis(redisUri);
  await redis.del("config:daily_count_limits");
  console.log("Cleared Redis cache for key 'config:daily_count_limits'.");
  await redis.quit();

  await mongoose.disconnect();
  console.log("Database disconnected. Migration finished successfully!");
}

run().catch(err => {
  console.error("Migration failed with error:", err);
  process.exit(1);
});
