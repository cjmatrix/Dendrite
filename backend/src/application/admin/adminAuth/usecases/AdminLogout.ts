import { inject, injectable } from "tsyringe";
import { ICacheService } from "../../../common/ports/ICacheService";

@injectable()
export class AdminLogoutUseCase {
  constructor(
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(refreshToken: string): Promise<void> {
    await this.cacheService.del(`refresh_token:${refreshToken}`);
  }
}
  