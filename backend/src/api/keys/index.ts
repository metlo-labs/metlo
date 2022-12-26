import ApiResponseHandler from "api-response-handler"
import { Response, Router } from "express"
import { ApiKey } from "models"
import { ApiKey as ApiKeyType } from "@common/types"
import Error404NotFound from "errors/error-404-not-found"
import { createApiKey } from "./service"
import Error400BadRequest from "errors/error-400-bad-request"
import { createQB, getRepository } from "services/database/utils"
import { MetloRequest } from "types"
import { API_KEY_TYPE } from "@common/enums"

export const listKeys = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const keys = await getRepository(req.ctx, ApiKey).find()
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
  const { name: keyName, keyFor } = req.body
  const key_exists = await getRepository(req.ctx, ApiKey).countBy({
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
  if (keyFor && !API_KEY_TYPE[keyFor]) {
    return ApiResponseHandler.error(
      res,
      new Error400BadRequest(
        `The key must be for one of the following: ${Object.keys(
          API_KEY_TYPE,
        ).join(", ")}`,
      ),
    )
  }
  const [key, rawKey] = createApiKey(keyName)
  if (keyFor) {
    key.for = API_KEY_TYPE[keyFor]
  }
  await getRepository(req.ctx, ApiKey).save(key)
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
    .andWhere("name = :name", { name: keyName })
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

export const getOnboardingKeys = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const keys = await getRepository(req.ctx, ApiKey).find({
      where: { for: API_KEY_TYPE.ONBOARDING },
      order: {
        createdAt: "DESC",
      },
    })
    const payload = keys
      ? keys.map<ApiKeyType>(v => ({
          name: v.name,
          identifier: `metlo.${v.keyIdentifier}`,
          created: v.createdAt.toISOString(),
          for: v.for,
        }))
      : null
    await ApiResponseHandler.success(res, payload)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export default function registerKeyRoutes(router: Router) {
  router.get("/api/v1/keys/list", listKeys)
  router.post("/api/v1/keys/create", createKey)
  router.delete("/api/v1/keys/:name/delete", deleteKey)
  router.get("/api/v1/keys/onboarding", getOnboardingKeys)
}
