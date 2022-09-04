import ApiResponseHandler from "api-response-handler"
import { AppDataSource } from "data-source"
import Error401Unauthorized from "errors/error-401-unauthorized"
import { NextFunction, Request, Response } from "express"
import { ApiKey } from "models"

export async function verify_api_key(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    await AppDataSource.getRepository(ApiKey)
      .createQueryBuilder("key")
      .where("key.apiKey = :api_key", { api_key: req.headers.authorization })
      .getOneOrFail()
    next()
  } catch (err) {
    await ApiResponseHandler.error(
      res,
      new Error401Unauthorized("Client unauthorized"),
    )
  }
}
