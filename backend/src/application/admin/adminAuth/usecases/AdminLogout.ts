import { inject, injectable } from "tsyringe";
import { ICacheService } from "../../../common/ports/ICacheService";
import { IAdminLogoutUseCase } from "./interfaces";

@injectable()
export class AdminLogoutUseCase implements IAdminLogoutUseCase {
  constructor(
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(refreshToken: string): Promise<void> {
    await this.cacheService.del(`refresh_token:${refreshToken}`);
  }
}
  