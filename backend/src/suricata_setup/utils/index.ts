import { RedisClient } from "utils/redis";

async function addToRedis(key, data: Object) {
  const redisClient = RedisClient.getInstance();
  await redisClient.set(key, JSON.stringify(data));
}
function addToRedisFromPromise(key, data: Promise<Object>) {
  const redisClient = RedisClient.getInstance();
  data
    .then((resp) => redisClient.set(key, JSON.stringify(resp)))
    .catch((err) => redisClient.set(key, JSON.stringify(err)));
}

async function getFromRedis(key) {
  const redisClient = RedisClient.getInstance();
  return JSON.parse(await redisClient.get(key));
}

async function deleteKeyFromRedis(key) {
  const redisClient = RedisClient.getInstance();
  return await redisClient.del([key]);
}

export { addToRedis, addToRedisFromPromise, getFromRedis, deleteKeyFromRedis };
