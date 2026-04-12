import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import Recall from '../../../models/Recall';

export class MongoRecallRepository implements IRecallRepository {
  async create(recallData: any): Promise<any> {
    const recall = new Recall(recallData);
    await recall.save();
    return recall;
  }

  async findByIdAndUserId(cardId: string, userId: string): Promise<any | null> {
    return Recall.findOne({ _id: cardId, userId });
  }

  async findDueCardsByUserId(userId: string, date: Date): Promise<any[]> {
    return Recall.find({
      userId,
      nextReview: { $lte: date },
    }).sort({ nextReview: -1 });
  }

  async findAllByUserId(userId: string): Promise<any[]> {
    return Recall.find({ userId });
  }

  async countDueCardsByUserId(userId: string, date: Date): Promise<number> {
    return Recall.countDocuments({
      userId,
      nextReview: { $lte: date },
    });
  }

  async save(card: any): Promise<any> {
    return card.save();
  }

  async deleteByCardIdAndUserId(cardId: string, userId: string): Promise<any> {
    return Recall.deleteOne({ _id: cardId, userId });
  }

  async deleteAllByUserId(userId: string): Promise<any> {
    return Recall.deleteMany({ userId });
  }
}
