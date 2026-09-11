import { IDeckRepository, IDeck } from '../../../domain/recall/repositories/IDeckRepository';
import Deck from '../models/MongoDeckModel';

export class MongoDeckRepository implements IDeckRepository {
  async create(deckData: Partial<IDeck>): Promise<IDeck> {
    const deck = new Deck(deckData);
    await deck.save();
    return deck as unknown as IDeck;
  }

  async findAllByUserId(userId: string): Promise<IDeck[]> {
    return Deck.find({ userId }).sort({ createdAt: -1 }) as unknown as IDeck[];
  }

  async findByIdAndUserId(deckId: string, userId: string): Promise<IDeck | null> {
    return Deck.findOne({ _id: deckId, userId }) as unknown as IDeck | null;
  }

  async findByNameAndUserId(name: string, userId: string): Promise<IDeck | null> {
    return Deck.findOne({ name, userId }) as unknown as IDeck | null;
  }

  async update(deckId: string, userId: string, updates: Partial<Pick<IDeck, 'name' | 'color'>>): Promise<IDeck | null> {
    return Deck.findOneAndUpdate(
      { _id: deckId, userId },
      { $set: updates },
      { new: true }
    ) as unknown as IDeck | null;
  }

  async delete(deckId: string, userId: string): Promise<IDeck | null> {
    return Deck.findOneAndDelete({ _id: deckId, userId }) as unknown as IDeck | null;
  }
}
