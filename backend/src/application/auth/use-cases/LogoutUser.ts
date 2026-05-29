import { IAuthService } from '../../../domain/auth/services/IAuthService';
import { ICacheService } from '../../../application/common/ports/ICacheService';
import { injectable, inject } from "tsyringe";
import { ILogoutUserUseCase } from "./interfaces";

@injectable()
export class LogoutUser implements ILogoutUserUseCase {
  constructor(
    @inject("IAuthService") private authService: IAuthService,
    @inject("ICacheService") private cacheService: ICacheService
  ) {}

  async execute(refreshToken: string) {
    try {
      this.authService.verifyRefreshToken(refreshToken);
      
   
      await this.cacheService.del(`refresh_token:${refreshToken}`);
    } catch(err) {
 
    }
  }
}
