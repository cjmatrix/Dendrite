import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';

export class CountDueCards {
  constructor(private recallRepository: IRecallRepository) {}

  async execute(userId: string) {
    const now = new Date();
    return await this.recallRepository.countDueCardsByUserId(userId, now);
  }
}
