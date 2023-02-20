import { Response, Router } from "express"
import { MetloRequest } from "types"
import ApiResponseHandler from "api-response-handler"
import {
  getEntityTagsCached,
  getTestingConfig,
  updateTestingConfig,
} from "services/testing-config"
import { UpdateTestingConfigParamsSchema } from "@common/api/testing-config"
import Error400BadRequest from "errors/error-400-bad-request"
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
        return await ApiResponseHandler.error(
          res,
          new Error400BadRequest(data.parseError.message),
        )
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

export default function registerTestingConfigRoutes(router: Router) {
  router.get("/api/v1/testing-config", getTestingConfigHandler)
  router.put("/api/v1/testing-config", updateTestingConfigHandler)
  router.get("/api/v1/testing-config/entity-tags", getEntityTagsHandler)
}
