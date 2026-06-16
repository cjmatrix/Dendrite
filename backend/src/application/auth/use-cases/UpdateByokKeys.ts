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

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const existingConfig = user.byok_keys?.find((k: any) => k.provider === provider);
    const existingEncryptedKeys = existingConfig?.encryptedKeys || [];

    const finalEncryptedKeys: string[] = [];

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i].trim();
      if (!key) continue;

      if (key.includes("•") || key.includes("●") || key.includes("*")) {
        // Masked key, preserve the existing encrypted key at this index
        if (existingEncryptedKeys[i]) {
          finalEncryptedKeys.push(existingEncryptedKeys[i]);
        }
      } else {
        // Raw key, encrypt and add
        finalEncryptedKeys.push(encryptKey(key));
      }
    }

    const existingKeyIndex = user.byok_keys?.findIndex((k: any) => k.provider === provider);

    let updateQuery;
    if (existingKeyIndex !== undefined && existingKeyIndex >= 0) {
      updateQuery = {
        $set: {
          [`byok_keys.${existingKeyIndex}.encryptedKeys`]: finalEncryptedKeys,
          [`byok_keys.${existingKeyIndex}.updatedAt`]: new Date(),
        },
      };
    } else {
      updateQuery = {
        $push: {
          byok_keys: {
            provider,
            encryptedKeys: finalEncryptedKeys,
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
