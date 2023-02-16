import { Response, Router } from "express"
import { MetloRequest } from "types"
import ApiResponseHandler from "api-response-handler"
import {
  getEntityTagsCached,
  getResourcePermissionsCached,
  getTestingConfig,
  updateTestingConfig,
} from "services/testing-config"
import { UpdateTestingConfigParamsSchema } from "@common/api/testing-config"

const updateTestingConfigHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsedBody = UpdateTestingConfigParamsSchema.safeParse(req.body)
    if (parsedBody.success === false) {
      return await ApiResponseHandler.zerr(res, parsedBody.error)
    }
    await updateTestingConfig(req.ctx, parsedBody.data)
    // Clear cached testing config
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
    const resourcePermissions = await getResourcePermissionsCached(req.ctx)
    await ApiResponseHandler.success(res, resourcePermissions)
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
