import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "";

async function migrate() {
  if (!MONGO_URI) {
    console.error("❌ MONGO_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    if (!db) {
      console.error("❌ Database connection not available");
      process.exit(1);
    }

    const chatsCollection = db.collection("chats");

    // Count how many chats are missing the field
    const missingCount = await chatsCollection.countDocuments({
      unsummarizedCount: { $exists: false },
    });

    console.log(`📊 Found ${missingCount} chats without 'unsummarizedCount' field`);

    if (missingCount === 0) {
      console.log("✅ All chats already have 'unsummarizedCount'. Nothing to do.");
      await mongoose.disconnect();
      process.exit(0);
    }

    // Set unsummarizedCount = 0 for all chats that don't have it
    const result = await chatsCollection.updateMany(
      { unsummarizedCount: { $exists: false } },
      { $set: { unsummarizedCount: 0 } }
    );

    console.log(`✅ Migration complete. Updated ${result.modifiedCount} chats.`);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrate();
