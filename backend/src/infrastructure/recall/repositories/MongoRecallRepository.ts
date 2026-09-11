import mongoose from 'mongoose';
import { IRecallRepository, IRecallCard, IRecallDeckStats, IDeckCardStats } from '../../../domain/recall/repositories/IRecallRepository';
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

  async findDueCardsByUserIdAndDeck(userId: string, date: Date, deckId: string | null): Promise<IRecallCard[]> {
    return Recall.find({
      userId,
      deckId: deckId,
      nextReview: { $lte: date },
    }).sort({ nextReview: -1 }) as unknown as IRecallCard[];
  }

  async moveCardToDeck(userId: string, cardId: string, deckId: string | null): Promise<IRecallCard | null> {
    return Recall.findOneAndUpdate(
      { _id: cardId, userId },
      { $set: { deckId } },
      { new: true }
    ) as unknown as IRecallCard | null;
  }

  async moveCardsToDeck(userId: string, fromDeckId: string | null, toDeckId: string | null): Promise<{ modifiedCount?: number }> {
    return Recall.updateMany(
      { userId, deckId: fromDeckId },
      { $set: { deckId: toDeckId } }
    );
  }

  async clearDeckReference(userId: string, deckId: string): Promise<{ modifiedCount?: number }> {
    return Recall.updateMany(
      { userId, deckId },
      { $set: { deckId: null } }
    );
  }

  async getDeckStatsByUserId(userId: string): Promise<IRecallDeckStats> {
    const stats = await Recall.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "$deckId",
          cardCount: { $sum: 1 },
          dueCardCount: {
            $sum: {
              $cond: [{ $lte: ["$nextReview", new Date()] }, 1, 0],
            },
          },
        },
      },
    ]);

    const byDeck: Record<string, IDeckCardStats> = {};
    const undecked: IDeckCardStats = { cardCount: 0, dueCardCount: 0 };
    const total: IDeckCardStats = { cardCount: 0, dueCardCount: 0 };

    for (const s of stats) {
      const cardCount = s.cardCount || 0;
      const dueCardCount = s.dueCardCount || 0;

      total.cardCount += cardCount;
      total.dueCardCount += dueCardCount;

      if (s._id) {
        byDeck[s._id.toString()] = { cardCount, dueCardCount };
      } else {
        undecked.cardCount = cardCount;
        undecked.dueCardCount = dueCardCount;
      }
    }

    return { byDeck, undecked, total };
  }
}
