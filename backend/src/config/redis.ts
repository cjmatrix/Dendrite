import { Redis } from "ioredis";

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null as null, 
};

const redisConnection = new Redis(redisConfig);

const redisSuspentionSubscriber = new Redis(redisConfig);


redisConnection.on("connect", async () => {
  console.log("Connected to Redis ");
  try {
    await redisConnection.config("SET", "notify-keyspace-events", "Ex");
    console.log("Redis keyspace notifications enabled successfully");
  } catch (err) {
    console.error("Failed to set Redis config for notifications:", err);
  }
});

redisSuspentionSubscriber.on("connect", () => {
  console.log("Connected to Redis (Subscriber)");
});



redisConnection.on("connect", () => {
  console.log("Connected to Redis");
});

redisConnection.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export { redisConnection, redisConfig,redisSuspentionSubscriber };
