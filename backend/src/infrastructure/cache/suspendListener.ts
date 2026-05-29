import { redisSuspentionSubscriber } from "../../config/redis";
import { container } from "tsyringe";
import { IUserRepository } from "../../domain/auth/repositories/IUserRepository";

export async function setupSuspensionListener() {

  const channel = "__keyevent@0__:expired";

  await redisSuspentionSubscriber.subscribe(channel);
 

  redisSuspentionSubscriber.on("message", async (subscribedChannel, expiredKey) => {
    if (subscribedChannel === channel && expiredKey.startsWith("suspend:")) {
      const userId = expiredKey.split(":")[1]; 
      
      console.log(`Suspension ended for user: ${userId}`);

      try {
        const userRepository = container.resolve<IUserRepository>("IUserRepository");
        await userRepository.findByIdAndUpdate(userId, { status: "active" });
        console.log(`User ${userId} is now active in MongoDB`);
      } catch (error) {
        console.error(`Failed to auto-activate user ${userId}:`, error);
      }
    }
  });
}



