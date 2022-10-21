import ApiResponseHandler from "api-response-handler"
import { AppDataSource } from "data-source"
import Error401Unauthorized from "errors/error-401-unauthorized"
import { NextFunction, Request, Response } from "express"
import { ApiKey } from "models"
import { hasher } from "utils/hash"

export async function verifyApiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    console.log("before hasher")
    let hashKey = hasher(req.headers.authorization)
    console.log("test log", hashKey)
    const apiKey = await AppDataSource.getRepository(ApiKey)
      .createQueryBuilder("key")
      .where("key.apiKeyHash = :hash", { hash: hashKey })
      .getOneOrFail()
    console.log("key", apiKey)
    next()
  } catch (err) {
    await ApiResponseHandler.error(
      res,
      new Error401Unauthorized("Client unauthorized"),
    )
  }
}
