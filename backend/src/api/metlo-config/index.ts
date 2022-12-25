import { Response, Router } from "express"
import { UpdateMetloConfigParams } from "@common/types"
import { getMetloConfig, updateMetloConfig } from "services/metlo-config"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"
import { clearDataClassCache } from "utils/dataclasses"

export const updateMetloConfigHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const updateMetloConfigParams: UpdateMetloConfigParams = req.body
    await updateMetloConfig(req.ctx, updateMetloConfigParams)
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
