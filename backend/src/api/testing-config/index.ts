import { Response, Router } from "express"
import { MetloRequest } from "types"
import ApiResponseHandler from "api-response-handler"
import {
  getEntityTagsCached,
  getAllResourcePermissionsCached,
  getTestingConfig,
  updateTestingConfig,
} from "services/testing-config"
import { UpdateTestingConfigParamsSchema } from "@common/api/testing-config"
import { RedisClient } from "utils/redis"

const updateTestingConfigHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsedBody = UpdateTestingConfigParamsSchema.safeParse(req.body)
    if (parsedBody.success === false) {
      return await ApiResponseHandler.zerr(res, parsedBody.error)
    }
    const data = await updateTestingConfig(req.ctx, parsedBody.data)
    if (!data.res) {
      if (data.zerr) {
        return await ApiResponseHandler.zerr(res, data.zerr)
      }
      if (data.parseError) {
        return await ApiResponseHandler.rawerror(res, data.parseError.message, {
          message: data.parseError.message,
          startColumn: data.parseError.location.start.column,
          startLine: data.parseError.location.start.line,
          endColumn: data.parseError.location.end.column,
          endLine: data.parseError.location.end.line,
        })
      }
    }
    await RedisClient.deleteFromRedis(req.ctx, ["entityTagsCached"])
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const getTestingConfigHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    let testingConfig = await getTestingConfig(req.ctx)
    if (!testingConfig) {
      testingConfig = {
        uuid: "",
        configString: "",
      }
    }
    await ApiResponseHandler.success(res, testingConfig)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const getEntityTagsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const entityTags = await getEntityTagsCached(req.ctx)
    await ApiResponseHandler.success(res, entityTags)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

const getResourcePermissionsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const perms = await getAllResourcePermissionsCached(req.ctx)
    await ApiResponseHandler.success(res, perms)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export default function registerTestingConfigRoutes(router: Router) {
  router.get("/api/v1/testing-config", getTestingConfigHandler)
  router.put("/api/v1/testing-config", updateTestingConfigHandler)
  router.get("/api/v1/testing-config/entity-tags", getEntityTagsHandler)
  router.get(
    "/api/v1/testing-config/resource-permissions",
    getResourcePermissionsHandler,
  )
}
