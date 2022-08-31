import IORedis from "ioredis"

export class RedisClient {
  private static instance: RedisClient
  private static client: IORedis

  private constructor(url) {
    RedisClient.client = new IORedis(url)
  }

  public static getInstance(): IORedis {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(process.env.REDIS_URL)
    }

    return RedisClient.client
  }
}
