import { container } from "tsyringe";
import { decryptKey } from "./cryptoUtils";
import { IUserRepository } from "../domain/auth/repositories/IUserRepository";
import { redisConnection } from "../config/redis";

export async function getCachedDecryptedKeys(userId: string, provider: string = "gemini"): Promise<string[]> {
  const redis = redisConnection;
  const cacheKey = `byok:${userId}:${provider}`;
  const cachedData = await redis.get(cacheKey);

  if (cachedData) {
    if (cachedData === "__NO_KEYS__") {
      throw new Error(`BYOK tier users must provide their own ${provider} API keys. Please upload your keys from the chat window.`);
    }
    const encryptedKeys = JSON.parse(cachedData) as string[];
    return encryptedKeys.map((k) => decryptKey(k)).filter(Boolean);
  }

  const userRepository = container.resolve<IUserRepository>("IUserRepository");
  const user = await userRepository.findById(userId);

  if (user?.tier !== "byok") {
    return [];
  }

  const byokEntry = user.byok_keys?.find((k) => k.provider === provider);
  if (!byokEntry || !byokEntry.encryptedKeys || byokEntry.encryptedKeys.length === 0) {
    // Cache the "__NO_KEYS__" state for 5 minutes to prevent DB spamming on invalid BYOK requests
    await redis.setex(cacheKey, 300, "__NO_KEYS__");
    throw new Error(`BYOK tier users must provide their own ${provider} API keys. Please upload your keys from the chat window.`);
  }

  // Cache the encrypted keys in Redis with a 30-minute TTL (1800 seconds)
  await redis.setex(cacheKey, 1800, JSON.stringify(byokEntry.encryptedKeys));

  return byokEntry.encryptedKeys.map((k) => decryptKey(k)).filter(Boolean);
}

export async function invalidateCachedKeys(userId: string, provider: string = "gemini"): Promise<void> {
  try {
    const redis = redisConnection;
    const cacheKey = `byok:${userId}:${provider}`;
    const indexKey = `byok:active_index:${userId}:${provider}`;
    await redis.del(cacheKey);
    await redis.del(indexKey);
  } catch (err) {
    console.error(`Error invalidating BYOK key cache for user ${userId}:`, err);
  }
}

export async function getActiveBYOKKeyIndex(userId: string, provider: string = "gemini"): Promise<number> {
  try {
    const redis = redisConnection;
    const indexKey = `byok:active_index:${userId}:${provider}`;
    const cachedIdx = await redis.get(indexKey);
    return cachedIdx ? parseInt(cachedIdx, 10) : 0;
  } catch (err) {
    console.error(`Error getting active BYOK key index for user ${userId}:`, err);
    return 0;
  }
}

export async function rotateBYOKKeyIndex(userId: string, totalKeys: number, provider: string = "gemini"): Promise<number> {
  try {
    if (totalKeys <= 0) return 0;
    const redis = redisConnection;
    const indexKey = `byok:active_index:${userId}:${provider}`;
    const cachedIdx = await redis.get(indexKey);
    let currentIndex = cachedIdx ? parseInt(cachedIdx, 10) : 0;
    currentIndex = (currentIndex + 1) % totalKeys;
    await redis.set(indexKey, currentIndex.toString());
    console.log(`[BYOK Key Rotation] User ${userId} rate limit. Switching to key index: ${currentIndex}`);
    return currentIndex;
  } catch (err) {
    console.error(`Error rotating BYOK key index for user ${userId}:`, err);
    return 0;
  }
}
