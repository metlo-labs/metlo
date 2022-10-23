import { RedisClient } from "utils/redis"

async function addToRedis(key, data: Object) {
  const redisClient = RedisClient.getInstance()
  await redisClient.set(key, JSON.stringify(data))
}
function addToRedisFromPromise(key, data: Promise<Object>) {
  const redisClient = RedisClient.getInstance()
  data
    .then(resp => redisClient.set(key, JSON.stringify(resp)))
    .catch(err => redisClient.set(key, JSON.stringify(err)))
}

async function getFromRedis(key) {
  const redisClient = RedisClient.getInstance()
  return JSON.parse(await redisClient.get(key))
}

async function deleteKeyFromRedis(key) {
  const redisClient = RedisClient.getInstance()
  if (Array.isArray(key)) {
    return await redisClient.del(key)
  }
  return await redisClient.del([key])
}

async function pushValueToRedisList(key, data: any) {
  const redisClient = RedisClient.getInstance()
  await redisClient.lpush(key, data)
}

async function getListFromRedis(key, start: number, end: number) {
  const redisClient = RedisClient.getInstance()
  return await redisClient.lrange(key, start, end)
}

export { addToRedis, addToRedisFromPromise, getFromRedis, deleteKeyFromRedis, pushValueToRedisList, getListFromRedis }
