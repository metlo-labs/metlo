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

  public static addToRedis(key: string, data: Object, expireIn?: number) {
    try {
      this.getInstance().set(key, JSON.stringify(data))
      if (expireIn) {
        this.getInstance().expire(key, expireIn, "NX")
      }
    } catch {}
  }

  public static async getFromRedis(key: string) {
    try {
      return JSON.parse(await this.getInstance().get(key))
    } catch {
      return null
    }
  }

  public static async deleteFromRedis(keys: string[]) {
    try {
      return await this.getInstance().del(keys)
    } catch (err) {
      console.error(`Error deleting from redis: ${err}`)
    }
  }

  public static pushValueToRedisList(
    key: string,
    data: (string | number | Buffer)[],
    right?: boolean,
  ) {
    try {
      if (right) {
        this.getInstance().rpush(key, ...data)
      } else {
        this.getInstance().lpush(key, ...data)
      }
    } catch (err) {
      console.error(`Error pushing value to redis list: ${err}`)
    }
  }

  public static async popValueFromRedisList(key: string, right?: boolean) {
    try {
      if (right) {
        return await this.getInstance().rpop(key)
      } else {
        return await this.getInstance().lpop(key)
      }
    } catch (err) {
      return null
    }
  }

  public static addValueToSet(key: string, data: string[]) {
    try {
      this.getInstance().sadd(key, ...data)
    } catch (err) {
      console.error(`Error adding value to redis set: ${err}`)
    }
  }

  public static async getValuesFromSet(key: string) {
    try {
      return await this.getInstance().smembers(key)
    } catch (err) {
      return []
    }
  }

  public static async getListValueFromRedis(
    key: string,
    start: number,
    end: number,
  ) {
    try {
      return await this.getInstance().lrange(key, start, end)
    } catch (err) {
      console.error(`Error retrieving list value from redis: ${err}`)
      return []
    }
  }
}
