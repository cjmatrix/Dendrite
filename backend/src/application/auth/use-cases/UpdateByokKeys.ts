import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../utils/AppError";
import { UpdateByokKeysInputDTO } from "../dtos/auth.dto";
import { injectable, inject } from "tsyringe";
import { IUpdateByokKeysUseCase } from "./interfaces";
import { encryptKey } from "../../../utils/cryptoUtils";
import { invalidateCachedKeys } from "../../../utils/byokKeysHelper";

@injectable()
export class UpdateByokKeys implements IUpdateByokKeysUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(input: UpdateByokKeysInputDTO): Promise<{ success: boolean; message: string }> {
    const { userId, provider, keys } = input;

    if (provider !== "gemini") {
      throw new AppError("Only gemini provider is currently supported for BYOK", 400);
    }

    const encryptedKeys = keys.map((key) => encryptKey(key));

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const existingKeyIndex = user.byok_keys?.findIndex((k: any) => k.provider === provider);

    let updateQuery;
    if (existingKeyIndex !== undefined && existingKeyIndex >= 0) {
      updateQuery = {
        $set: {
          [`byok_keys.${existingKeyIndex}.encryptedKeys`]: encryptedKeys,
          [`byok_keys.${existingKeyIndex}.updatedAt`]: new Date(),
        },
      };
    } else {
      updateQuery = {
        $push: {
          byok_keys: {
            provider,
            encryptedKeys,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      };
    }

    await this.userRepository.findByIdAndUpdate(userId, updateQuery);

    // Invalidate the cache in Redis so the new keys take effect immediately
    await invalidateCachedKeys(userId, provider);

    return { success: true, message: "BYOK keys updated successfully" };
  }
}
