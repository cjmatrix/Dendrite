import { IRecallRepository, IRecallCard } from '../../../domain/recall/repositories/IRecallRepository';
import Recall from '../models/MongoRecallModel';

export class MongoRecallRepository implements IRecallRepository {
  async create(recallData: Partial<IRecallCard>): Promise<IRecallCard> {
    const recall = new Recall(recallData);
    await recall.save();
    return recall as unknown as IRecallCard;
  }

  async findByIdAndUserId(cardId: string, userId: string): Promise<IRecallCard | null> {
    return Recall.findOne({ _id: cardId, userId }) as unknown as IRecallCard | null;
  }

  async findDueCardsByUserId(userId: string, date: Date): Promise<IRecallCard[]> {
    return Recall.find({
      userId,
      nextReview: { $lte: date },
    }).sort({ nextReview: -1 }) as unknown as IRecallCard[];
  }

  async findAllByUserId(userId: string): Promise<IRecallCard[]> {
    return Recall.find({ userId }) as unknown as IRecallCard[];
  }

  async countDueCardsByUserId(userId: string, date: Date): Promise<number> {
    return Recall.countDocuments({
      userId,
      nextReview: { $lte: date },
    });
  }

  async save(card: IRecallCard): Promise<IRecallCard> {
    return (card as unknown as { save(): Promise<IRecallCard> }).save();
  }

  async deleteByCardIdAndUserId(cardId: string, userId: string): Promise<IRecallCard | null> {
    return Recall.deleteOne({ _id: cardId, userId }) as unknown as IRecallCard | null;
  }

  async deleteAllByUserId(userId: string): Promise<{ deletedCount?: number }> {
    return Recall.deleteMany({ userId });
  }
}
