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

      
      const recall = await Recall.findOne({ 
        _id: cardId, 
        userId: userId,
        nextReview: { $lte: now }
      });

      if (!recall) {
        console.log(`Recall ${cardId} is no longer due or was deleted.`);
        return;
      }

   
      const user = await User.findById(userId).select("fcmToken");
      
      if (!user || !user.fcmToken || user.fcmToken.length === 0) {
        console.log(`User ${userId} has no FCM token. Notification skipped.`);
        return;
      }

     
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
      throw error; 
    }
  },
  {
    connection: redisConfig,
    concurrency: 5, 
  }
);

recallWorker.on("completed", (job) => {
  console.log(`🔔 Recall Notification Job ${job.id} completed`);
});

recallWorker.on("failed", (job, err) => {
  console.error(`🔔 Recall Notification Job ${job?.id} failed:`, err.message);
});

export default recallWorker;
