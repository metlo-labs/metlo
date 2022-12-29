import { Response, Router } from "express"
import { UpdateMetloConfigParams } from "@common/types"
import { getMetloConfig, updateMetloConfig } from "services/metlo-config"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"
import { cleanupStoredDataClasses, clearDataClassCache, ensureValidCustomDataClasses } from "services/data-classes"
import Error422UnprocessableEntity from "errors/error-422-unprocessable-entity"

export const updateMetloConfigHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const updateMetloConfigParams: UpdateMetloConfigParams = req.body
    const currentMetloConfig = await getMetloConfig(req.ctx)
    const { success, msg, err } = await ensureValidCustomDataClasses(req.ctx, updateMetloConfigParams.configString)
    if (!success) {
      await ApiResponseHandler.error(res, new Error422UnprocessableEntity(msg))
      return
    }
    await updateMetloConfig(req.ctx, updateMetloConfigParams)
    await cleanupStoredDataClasses(req.ctx, currentMetloConfig, updateMetloConfigParams.configString)
    await clearDataClassCache(req.ctx)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getMetloConfigHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    let metloConfig = await getMetloConfig(req.ctx)
    if (!metloConfig) {
      metloConfig = {
        uuid: "",
        configString: "",
      }
    }
    await ApiResponseHandler.success(res, metloConfig)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export default function registerMetloConfigRoutes(router: Router) {
  router.put("/api/v1/metlo-config", updateMetloConfigHandler)
  router.get("/api/v1/metlo-config", getMetloConfigHandler)
}
