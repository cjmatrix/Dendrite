import dotenv from "dotenv";
import path from "path";
// Load env vars
dotenv.config();

import mongoose from "mongoose";
import { MongoTransaction } from "../infrastructure/billing/models/MongoTransactionModel";

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
  let userIdObj: mongoose.Types.ObjectId;
  if (user) {
    userIdObj = user._id;
    console.log(`Using existing user: ${user.email} (${userIdObj.toString()})`);
  } else {
    userIdObj = new mongoose.Types.ObjectId();
    console.log(`No users found. Using generated user ID: ${userIdObj.toString()}`);
  }

  // Clear existing transactions
  console.log("Clearing existing transactions collection...");
  await MongoTransaction.deleteMany({});

  const tiers = ["pro", "plus", "enterprise", "byok"];
  const prices: Record<string, number> = {
    pro: 15,
    plus: 29,
    enterprise: 99,
    byok: 9,
  };

  const dummyDocs = [];
  let transactionCounter = 1000;

  // Generate data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate 1 to 5 transactions per day
    const numTransactions = Math.floor(Math.random() * 5) + 1;

    for (let j = 0; j < numTransactions; j++) {
      // Add some random hour/minute/second to the date
      const transactionDate = new Date(date);
      transactionDate.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      );

      const tier = tiers[Math.floor(Math.random() * tiers.length)];
      const amount = prices[tier];
      transactionCounter++;

      dummyDocs.push({
        userId: userIdObj,
        transactionId: `txn_${transactionCounter}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: `cust_${Math.random().toString(36).substr(2, 9)}`,
        subscriptionId: `sub_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: "USD",
        tier: tier,
        status: "completed",
        createdAt: transactionDate,
        updatedAt: transactionDate,
      });
    }
  }

  console.log(`Inserting ${dummyDocs.length} dummy transaction documents...`);
  
  // Use raw collection insert to guarantee that custom createdAt/updatedAt are preserved
  const transactionsCollection = db.collection("transactions");
  await transactionsCollection.insertMany(dummyDocs);
  
  console.log("Transaction seeding finished successfully!");

  await mongoose.disconnect();
}

runSeed().catch((err) => {
  console.error("Transaction seed failed:", err);
  process.exit(1);
});
