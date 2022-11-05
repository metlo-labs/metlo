import ApiResponseHandler from "api-response-handler"
import { Response } from "express"
import { AppDataSource } from "data-source"
import { ApiKey } from "models"
import { ApiKey as ApiKeyType } from "@common/types"
import Error404NotFound from "errors/error-404-not-found"
import { createApiKey } from "./service"
import Error400BadRequest from "errors/error-400-bad-request"
import { createQB } from "services/database/utils"
import { MetloRequest } from "types"

export const listKeys = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const keys = await AppDataSource.getRepository(ApiKey).find()
  return ApiResponseHandler.success(
    res,
    keys.map<ApiKeyType>(v => ({
      name: v.name,
      identifier: `metlo.${v.keyIdentifier}`,
      created: v.createdAt.toISOString(),
      for: v.for,
    })),
  )
}

export const createKey = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { name: keyName } = req.body
  const key_exists = await AppDataSource.getRepository(ApiKey).countBy({
    name: keyName,
  })
  if (key_exists) {
    return ApiResponseHandler.error(
      res,
      new Error400BadRequest(`Can not create key with name ${keyName}`),
    )
  }
  if (!keyName) {
    return ApiResponseHandler.error(
      res,
      new Error400BadRequest(`Key name is required.`),
    )
  }
  const [key, rawKey] = createApiKey(keyName)
  await AppDataSource.getRepository(ApiKey).save(key)
  return ApiResponseHandler.success(res, {
    apiKey: rawKey,
    name: key.name,
    identifier: `metlo.${key.keyIdentifier}`,
    created: key.createdAt.toISOString(),
    for: key.for,
  })
}

export const deleteKey = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { name: keyName } = req.params

  let del_resp = await createQB(req.ctx)
    .delete()
    .from(ApiKey)
    .where("name = :name", { name: keyName })
    .execute()

  if (del_resp.affected != 0) {
    return ApiResponseHandler.success(res, {
      status: "OK",
    })
  } else {
    return ApiResponseHandler.error(
      res,
      new Error404NotFound(`Did not find any matching keys for ${keyName}`),
    )
  }
}
