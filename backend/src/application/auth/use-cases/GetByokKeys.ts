import { IUserRepository } from "../../../domain/auth/repositories/IUserRepository";
import { AppError } from "../../../utils/AppError";
import { injectable, inject } from "tsyringe";
import { IGetByokKeysUseCase } from "./interfaces";
import { decryptKey } from "../../../utils/cryptoUtils";

function maskApiKey(key: string): string {
  if (!key) return "";
  if (key.length <= 8) {
    return "••••" + key.substring(Math.max(0, key.length - 2));
  }
  return key.substring(0, 6) + "••••••••••••" + key.substring(key.length - 4);
}

@injectable()
export class GetByokKeys implements IGetByokKeysUseCase {
  constructor(
    @inject("IUserRepository") private userRepository: IUserRepository
  ) {}

  async execute(userId: string, provider: string): Promise<{ success: boolean; keys: string[] }> {
    if (provider !== "gemini") {
      throw new AppError("Only gemini provider is currently supported for BYOK", 400);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const keyConfig = user.byok_keys?.find((k: any) => k.provider === provider);
    const resultKeys: string[] = ["", "", "", "", "", ""];

    if (keyConfig && keyConfig.encryptedKeys) {
      keyConfig.encryptedKeys.forEach((encKey: string, index: number) => {
        if (index < 6) {
          const decrypted = decryptKey(encKey);
          resultKeys[index] = maskApiKey(decrypted);
        }
      });
    }

    return { success: true, keys: resultKeys };
  }
}
