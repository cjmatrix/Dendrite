import { Worker, Job } from "bullmq";
import { redisConfig } from "../config/redis";
import admin from "../config/firebase";
import Recall from "../models/Recall";
import { User } from "../models/User";

interface RecallJobData {
  userId: string;
  cardId: string;
}

const recallWorker = new Worker<RecallJobData>(
  "recall-queue",
  async (job: Job<RecallJobData>) => {
    const { userId, cardId } = job.data;
    
    try {
      const now = new Date();

      // Check if the recall card STILL exists and is STILL due 
      // (in case they reviewed it early and the job wasn't canceled somehow)
      const recall = await Recall.findOne({ 
        _id: cardId, 
        userId: userId,
        nextReview: { $lte: now }
      });

      if (!recall) {
        console.log(`Recall ${cardId} is no longer due or was deleted.`);
        return;
      }

      // Check if user has an FCM token
      const user = await User.findById(userId).select("fcmToken");
      
      if (!user || !user.fcmToken || user.fcmToken.length === 0) {
        console.log(`User ${userId} has no FCM token. Notification skipped.`);
        return;
      }

      // At this exact moment, they have AT LEAST 1 card due (the current one)
      // but maybe others hit their delay at the exact same minute. Let's send a neat push.
      const message = {
        notification: {
          title: "Time for Active Recall!",
          body: "You have a card ready for review. Keep your brain sharp! 🧠",
        },
        tokens: user.fcmToken,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Successfully sent recall notification to User: ${userId}`);
      
    } catch (error: any) {
      console.log(`Failed to process recall notification for ${cardId}:`, error.message);
      throw error; // Let BullMQ retry
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, // We can run a few pushes concurrently
  }
);

recallWorker.on("completed", (job) => {
  console.log(`🔔 Recall Notification Job ${job.id} completed`);
});

recallWorker.on("failed", (job, err) => {
  console.error(`🔔 Recall Notification Job ${job?.id} failed:`, err.message);
});

export default recallWorker;
