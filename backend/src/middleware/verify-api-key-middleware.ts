import ApiResponseHandler from "api-response-handler"
import Error401Unauthorized from "errors/error-401-unauthorized"
import { NextFunction, Response } from "express"
import { ApiKey } from "models"
import { getRepoQB } from "services/database/utils"
import { MetloRequest } from "types"
import { hasher } from "utils/hash"
import { RedisClient } from "utils/redis"

export async function verifyApiKeyMiddleware(
  req: MetloRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    let hashKey = hasher(req.headers.authorization)
    const cachedHashKey = await RedisClient.getFromRedis(req.ctx, hashKey)
    if (!cachedHashKey) {
      await getRepoQB(req.ctx, ApiKey, "key")
        .andWhere("key.apiKeyHash = :hash", { hash: hashKey })
        .getOneOrFail()
      RedisClient.addToRedis(req.ctx, hashKey, true, 5)
    }
    next()
  } catch (err) {
    await ApiResponseHandler.error(
      res,
      new Error401Unauthorized("Client unauthorized"),
    )
  }
}
