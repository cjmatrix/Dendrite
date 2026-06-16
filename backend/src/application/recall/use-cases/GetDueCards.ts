import { injectable, inject } from "tsyringe";
import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';
import { IGetDueCardsUseCase } from "./interfaces";

@injectable()
export class GetDueCards implements IGetDueCardsUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string) {
    const now = new Date();
    return await this.recallRepository.findDueCardsByUserId(userId, now);
  }
}
