import { injectable, inject } from "tsyringe";
import { IDeckRepository } from "../../../domain/recall/repositories/IDeckRepository";
import { IRecallRepository } from "../../../domain/recall/repositories/IRecallRepository";
import { IGetDecksUseCase } from "./interfaces";

@injectable()
export class GetDecks implements IGetDecksUseCase {
  constructor(
    @inject("IDeckRepository") private deckRepository: IDeckRepository,
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string) {
    const [decks, stats] = await Promise.all([
      this.deckRepository.findAllByUserId(userId),
      this.recallRepository.getDeckStatsByUserId(userId),
    ]);

    return decks.map((deck) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = typeof (deck as any).toObject === "function" ? (deck as any).toObject() : deck;
      const deckIdStr = raw._id.toString();
      const deckStat = stats.byDeck[deckIdStr] || { cardCount: 0, dueCardCount: 0 };

      return {
        ...raw,
        _id: deckIdStr,
        cardCount: deckStat.cardCount,
        dueCardCount: deckStat.dueCardCount,
      };
    });
  }
}
