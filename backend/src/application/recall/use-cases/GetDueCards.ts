import { IRecallRepository } from '../../../domain/recall/repositories/IRecallRepository';

export class GetDueCards {
  constructor(private recallRepository: IRecallRepository) {}

  async execute(userId: string) {
    const now = new Date();
    return await this.recallRepository.findDueCardsByUserId(userId, now);
  }
}
