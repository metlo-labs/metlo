import ApiResponseHandler from "api-response-handler"
import { AppDataSource } from "data-source"
import Error401Unauthorized from "errors/error-401-unauthorized"
import { NextFunction, Request, Response } from "express"
import { ApiKey } from "models"
import { hasher } from "utils/hash"
import { RedisClient } from "utils/redis"

export async function verifyApiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    let hashKey = hasher(req.headers.authorization)
    const cachedHashKey = await RedisClient.getFromRedis(hashKey)
    if (!cachedHashKey) {
      await AppDataSource.getRepository(ApiKey)
        .createQueryBuilder("key")
        .where("key.apiKeyHash = :hash", { hash: hashKey })
        .getOneOrFail()
      RedisClient.addToRedis(hashKey, true, 5)
    }
    next()
  } catch (err) {
    await ApiResponseHandler.error(
      res,
      new Error401Unauthorized("Client unauthorized"),
    )
  }
}
