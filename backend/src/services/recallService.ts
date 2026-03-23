import Recall from "../models/Recall";
import { AppError } from "../utils/AppError";
import { scheduleRecallNotification, recallQueue } from "../queue/recallQueue";

const steps = [1, 10, 30]; 

async function createCard(userId:string,content:string,chatId:string){
  const recall = new Recall({
    userId,
    chatId,
    content,
    nextReview: new Date(Date.now() + 5000), // 1 minute default
  });

  const delayInMs = recall.nextReview.getTime() - Date.now();
  const jobId = await scheduleRecallNotification(userId, recall._id.toString(), delayInMs);
  if (jobId) {
    recall.jobId = jobId;
  }

  await recall.save();
  return recall;
}

async function updateCard(userId:string,cardId:string,rating:number) {

  const card = await Recall.findOne({ _id: cardId, userId });
  if(!card){
      throw new AppError("No card",400)
  }

  const now = new Date();


  if (card.stage === "learning") {
    if (rating >= 3) {
      if (card.stepIndex < steps.length - 1) {
        card.stepIndex++;
        card.nextReview = new Date(now.getTime() + steps[card.stepIndex] * 60000);
      } else {
        card.stage = "review";
        card.repetitions = 1;
        card.interval = 1;
        card.nextReview = new Date(now.getTime() + 86400000);
      }
    } else {
      card.stepIndex = 0;
      card.nextReview = new Date(now.getTime() + 60000);
    }
  }

  // REVIEW PHASE (SM2)
  else {
    if (rating < 3) {
      card.stage = "learning";
      card.stepIndex = 0;
      card.nextReview = new Date(now.getTime() + 60000);
    } else {
      card.easeFactor =
        card.easeFactor +
        (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));

      if (card.easeFactor < 1.3) card.easeFactor = 1.3;

      if (card.repetitions === 1) card.interval = 1;
      else if (card.repetitions === 2) card.interval = 6;
      else card.interval = Math.round(card.interval * card.easeFactor);

      card.repetitions++;
      card.nextReview = new Date(now.getTime() + card.interval * 86400000);
    }
  }

  const delayInMs = Math.max(0, card.nextReview.getTime() - Date.now());
  const newJobId = await scheduleRecallNotification(userId, card._id.toString(), delayInMs, card.jobId);
  
  if (newJobId) {
    card.jobId = newJobId;
  }

  await card.save();
  return card;
}

async function getDueCards(userId: string) {
  const now = new Date();
  const dueCards = await Recall.find({
    userId,
    nextReview: { $lte: now }
  }).sort({ nextReview: 1 });
  
  return dueCards;
}

async function deleteCard(userId: string, cardId: string) {
  const card = await Recall.findOne({ _id: cardId, userId });
  if (card && card.jobId) {
    try {
      await recallQueue.remove(card.jobId);
    } catch (error) {
      console.log(`Failed to remove job ${card.jobId} from queue`, error);
    }
  }
  return await Recall.deleteOne({ _id: cardId, userId });
}

async function clearAllCards(userId: string) {
  const cards = await Recall.find({ userId });
  for (const card of cards) {
    if (card.jobId) {
      try {
        await recallQueue.remove(card.jobId);
      } catch (error) {
        console.log(`Failed to remove job ${card.jobId} from queue`, error);
      }
    }
  }
  return await Recall.deleteMany({ userId });
}

export {createCard, updateCard, getDueCards, deleteCard, clearAllCards}