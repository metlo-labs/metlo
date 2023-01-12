import mlog from "logger"
import IORedis from "ioredis"
import { MetloContext } from "types"

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

  public static async addToRedis(
    ctx: MetloContext,
    key: string,
    data: Object,
    expireIn?: number,
  ) {
    try {
      await this.getInstance().set(key, JSON.stringify(data))
      if (expireIn) {
        this.getInstance().expire(key, expireIn)
      }
    } catch {}
  }

  public static async getFromRedis(ctx: MetloContext, key: string) {
    try {
      return JSON.parse(await this.getInstance().get(key))
    } catch {
      return null
    }
  }

  public static async deleteFromRedis(ctx: MetloContext, keys: string[]) {
    try {
      return await this.getInstance().del(keys)
    } catch (err) {
      mlog.withErr(err).error("Error deleting from redis")
    }
  }

  public static async deleteKeyFromRedis(ctx: MetloContext, key: string) {
    const redisClient = RedisClient.getInstance()
    return await redisClient.del([key])
  }

  public static async pushValueToRedisList(
    ctx: MetloContext,
    key: string,
    data: (string | number | Buffer)[],
    right?: boolean,
  ) {
    try {
      if (right) {
        await this.getInstance().rpush(key, ...data)
      } else {
        await this.getInstance().lpush(key, ...data)
      }
    } catch (err) {
      mlog.withErr(err).error("Error pushing value to redis list")
    }
  }

  public static async popValueFromRedisList(
    ctx: MetloContext,
    key: string,
    right?: boolean,
  ) {
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

  public static async addValueToSet(
    ctx: MetloContext,
    key: string,
    data: string[],
  ) {
    try {
      if (data?.length > 0) {
        await this.getInstance().sadd(key, ...data)
      }
    } catch (err) {
      mlog.withErr(err).error("Error adding value to redis set")
    }
  }

  public static async getValuesFromSet(ctx: MetloContext, key: string) {
    try {
      return await this.getInstance().smembers(key)
    } catch (err) {
      return []
    }
  }

  public static async isSetMember(
    ctx: MetloContext,
    key: string,
    data: string,
  ) {
    try {
      const res = await this.getInstance().sismember(key, data)
      return res == 1
    } catch (err) {
      return false
    }
  }

  public static async getListValueFromRedis(
    ctx: MetloContext,
    key: string,
    start: number,
    end: number,
  ) {
    try {
      return await this.getInstance().lrange(key, start, end)
    } catch (err) {
      mlog.withErr(err).error("Error retrieving list value from redis")
      return []
    }
  }

  public static async getListLength(ctx: MetloContext, key: string) {
    try {
      return await this.getInstance().llen(key)
    } catch (err) {
      return 0
    }
  }

  public static addToRedisFromPromise(
    ctx: MetloContext,
    key: string,
    data: Promise<Object>,
  ) {
    const redisClient = RedisClient.getInstance()
    data
      .then(resp => redisClient.set(key, JSON.stringify(resp)))
      .catch(err => redisClient.set(key, JSON.stringify(err)))
  }
}
