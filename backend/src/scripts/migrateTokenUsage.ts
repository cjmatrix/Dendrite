import dotenv from "dotenv";
import path from "path";
// Load env vars
dotenv.config();

import mongoose from "mongoose";
import { User } from "../infrastructure/auth/models/MongoUserModel";

async function runMigration() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/dentrites";
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected successfully.`);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not established");
  }
  const usersCollection = db.collection("users");
  const users = await usersCollection.find({}).toArray();
  console.log(`Found ${users.length} raw user documents in database.`);

  let migratedCount = 0;
  for (const user of users) {
    console.log(`Resetting token_usage for user: ${user.email} (${user._id})`);

    const emptyFeature = { input: 0, output: 0, total: 0 };
    const emptyProvider = {
      mainChat: emptyFeature,
      chatSummary: emptyFeature,
      codeDescription: emptyFeature,
      p5Visualization: emptyFeature,
      quickChat: emptyFeature,
    };

    const newTokenUsage = {
      google: emptyProvider,
      anthropic: emptyProvider,
      openai: emptyProvider,
      openrouter: emptyProvider,
      groq: emptyProvider,
      mistral: emptyProvider,
      lastResetDate: new Date(),
    };

    await usersCollection.updateOne(
      { _id: user._id },
      { 
        $set: { 
          token_usage: newTokenUsage,
          tokensUsed: 0
        } 
      }
    );
    migratedCount++;
  }

  console.log(`Migration finished. Migrated ${migratedCount} users.`);
  await mongoose.disconnect();
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
