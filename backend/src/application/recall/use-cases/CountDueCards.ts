import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { ICountDueCardsUseCase } from "./interfaces";

@injectable()
export class CountDueCards implements ICountDueCardsUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string) {
    const now = new Date();
    return await this.recallRepository.countDueCardsByUserId(userId, now);
  }
}
