import { injectable, inject } from "tsyringe";
import { IRecallRepository } from "../../../domain/recall/repositories/IRecallRepository";
import { IGetDeckStatsUseCase } from "./interfaces";

@injectable()
export class GetDeckStats implements IGetDeckStatsUseCase {
  constructor(
    @inject("IRecallRepository") private recallRepository: IRecallRepository
  ) {}

  async execute(userId: string) {
    return await this.recallRepository.getDeckStatsByUserId(userId);
  }
}
