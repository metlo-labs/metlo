import ApiResponseHandler from "api-response-handler"
import Error401Unauthorized from "errors/error-401-unauthorized"
import { NextFunction, Response } from "express"
import { ApiKey } from "models"
import { getRepoQB } from "services/database/utils"
import { MetloContext, MetloRequest } from "types"
import { hasher } from "utils/hash"
import { RedisClient } from "utils/redis"

export async function verifyApiKeyMiddleware(
  req: MetloRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const keyExists = apiKeyVerificationInner(req.ctx, req.headers.authorization)
    next()
  } catch (err) {
    await ApiResponseHandler.error(
      res,
      new Error401Unauthorized("Client unauthorized"),
    )
  }
}

export async function apiKeyVerificationInner(ctx: MetloContext, key: string) {
  let hashKey = hasher(key)
  const cachedHashKey = await RedisClient.getFromRedis(ctx, hashKey)
  if (!cachedHashKey) {
    await getRepoQB(ctx, ApiKey, "key")
      .andWhere("key.apiKeyHash = :hash", { hash: hashKey })
      .getOneOrFail()
    RedisClient.addToRedis(ctx, cachedHashKey, true, 5)
  }
}