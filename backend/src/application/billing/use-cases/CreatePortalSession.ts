import { inject, injectable } from "tsyringe";
import { IBillingProvider } from "../../common/ports/IBillingProvider";
import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { ICreatePortalSessionUseCase } from "./interfaces";
import { AppError } from "../../../utils/AppError";

@injectable()
export class CreatePortalSession implements ICreatePortalSessionUseCase {
  constructor(
    @inject("IBillingProvider") private billingProvider: IBillingProvider,
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(userId: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new AppError("User not found", 404);
    if (!user.billingCustomerId) throw new AppError("User does not have an active subscription", 400);

    return await this.billingProvider.createPortalSession(user.billingCustomerId);
  }
}
