import mlog from "logger"
import IORedis from "ioredis"
import { MetloContext } from "types"
import { USAGE_GRANULARITY } from "../constants"

export class RedisClient {
  private static instance: RedisClient
  private static usageInstance: RedisClient
  private static queueInstance: RedisClient
  private client: IORedis

  private constructor(url) {
    this.client = new IORedis(url)
  }

  public static getInstance(): IORedis {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(process.env.REDIS_URL)
    }
    return RedisClient.instance.client
  }

  public static getUsageInstance(): IORedis {
    if (!RedisClient.usageInstance) {
      RedisClient.usageInstance = new RedisClient(
        process.env.USAGE_REDIS_URL || process.env.REDIS_URL,
      )
    }
    return RedisClient.usageInstance.client
  }

  public static getQueueInstance(): IORedis {
    if (!RedisClient.queueInstance) {
      RedisClient.queueInstance = new RedisClient(
        process.env.QUEUE_REDIS_URL || process.env.REDIS_URL,
      )
    }
    return RedisClient.queueInstance.client
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

  public static async expire(ctx: MetloContext, key: string, expireIn: number) {
    try {
      this.getInstance().expire(key, expireIn)
    } catch (err) {
      mlog.withErr(err).error("Error expiring redis item")
    }
  }

  public static async ltrim(
    ctx: MetloContext,
    key: string,
    start: number,
    stop: number,
  ) {
    try {
      this.getInstance().ltrim(key, start, stop)
    } catch (err) {
      mlog.withErr(err).error("Error trimming redis list")
    }
  }

  public static async lrange(
    ctx: MetloContext,
    key: string,
    start: number,
    end: number,
  ) {
    try {
      return await this.getInstance().lrange(key, start, end)
    } catch (err) {
      mlog.withErr(err).error("Error getting redis list")
      return null
    }
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

  public static async pushToListPipeline(
    ctx: MetloContext,
    key: string,
    data: (string | number | Buffer)[],
    maxItems: number,
    expSecs: number,
  ) {
    try {
      const pipeline = this.getInstance().pipeline()
      pipeline.lpush(key, ...data)
      pipeline.ltrim(key, 0, maxItems - 1)
      pipeline.expire(key, expSecs)
      await pipeline.exec()
    } catch (err) {
      mlog.withErr(err).error("Error pushing value to redis list pipeline")
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

  public static async getFromRedisUsage(ctx: MetloContext, key: string) {
    try {
      return JSON.parse(await this.getUsageInstance().get(key))
    } catch {
      return null
    }
  }

  public static getHashUsage(ctx: MetloContext, hashKey: string) {
    return RedisClient.getUsageInstance().hgetall(hashKey)
  }

  public static async deleteUsage(ctx: MetloContext, key: string) {
    const redisClient = RedisClient.getUsageInstance()
    return await redisClient.del([key])
  }

  public static async incrementEndpointSeenUsage(
    ctx: MetloContext,
    endpointUUID: string,
    endpointCallCountKey: string,
    orgCallCountKey: string,
  ) {
    const time = new Date().getTime()
    const timeSlot = time - (time % USAGE_GRANULARITY)
    const callCountKey = `${orgCallCountKey}_${timeSlot}`

    const pipeline = RedisClient.getUsageInstance().pipeline()
    pipeline.hincrby(endpointCallCountKey, endpointUUID, 1)
    pipeline.incr(callCountKey)
    pipeline.expire(callCountKey, 2 * 60)
    return await pipeline.exec()
  }
}
