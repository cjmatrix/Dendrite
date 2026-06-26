import dotenv from "dotenv";
import path from "path";
// Load env vars
dotenv.config();

import mongoose from "mongoose";
import { DailyTokenUsage } from "../infrastructure/usage/models/MongoDailyTokenUsageModel";

async function runSeed() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dentrites";
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected successfully.`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }

  // Get a user ID to associate with the dummy data
  const usersCollection = db.collection("users");
  const user = await usersCollection.findOne({});
  let userIdStr: string;
  if (user) {
    userIdStr = user._id.toString();
    console.log(`Using existing user: ${user.email} (${userIdStr})`);
  } else {
    userIdStr = new mongoose.Types.ObjectId().toString();
    console.log(`No users found. Using generated user ID: ${userIdStr}`);
  }

  // Clear existing daily token usage
  console.log("Clearing existing DailyTokenUsage collection...");
  await DailyTokenUsage.deleteMany({});

  const providers = ["google", "anthropic", "openai", "openrouter", "groq", "mistral"];
  const features = ["mainChat", "chatSummary", "codeDescription", "p5Visualization", "quickChat"];
  const tiers = ["free", "pro", "enterprise"];

  const dummyDocs = [];

  // Generate data for the last 40 days
  for (let i = 0; i < 40; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setUTCHours(0, 0, 0, 0);

    const tierAtTime = tiers[i % tiers.length];

    const tokenUsage: Record<string, Record<string, { input: number; output: number; total: number }>> = {};
    for (const provider of providers) {
      tokenUsage[provider] = {};
      for (const feature of features) {
        // Random usage
        const input = Math.floor(Math.random() * 5000) + 100;
        const output = Math.floor(Math.random() * 8000) + 200;
        const total = input + output;

        tokenUsage[provider][feature] = {
          input,
          output,
          total,
        };
      }
    }

    dummyDocs.push({
      userId: userIdStr,
      date,
      tierAtTime,
      token_usage: tokenUsage,
    });
  }

  console.log(`Inserting ${dummyDocs.length} dummy daily token usage documents...`);
  await DailyTokenUsage.insertMany(dummyDocs);
  console.log("Seeding finished successfully!");

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
