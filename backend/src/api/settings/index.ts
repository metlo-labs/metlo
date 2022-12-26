import { Response, Router } from "express"
import ApiResponseHandler from "api-response-handler"
import { InstanceSettings } from "models"
import { getRepository } from "services/database/utils"
import { MetloRequest } from "types"

export const getInstanceSettingsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const instanceSettingsRepository = getRepository(req.ctx, InstanceSettings)
    const instanceSettings = await instanceSettingsRepository.findOne({
      where: {},
    })
    await ApiResponseHandler.success(res, instanceSettings)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const putInstanceSettingsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, skip } = req.body
    const instanceSettingsRepository = getRepository(req.ctx, InstanceSettings)
    const instanceSettings = await instanceSettingsRepository.findOne({
      where: {},
    })
    instanceSettings.updateEmail = email
    instanceSettings.skippedUpdateEmail = skip
    await instanceSettingsRepository.save(instanceSettings)
    await ApiResponseHandler.success(res, instanceSettings)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export default function registerInstanceSettingsRoutes(router: Router) {
  router.get("/api/v1/instance-settings", getInstanceSettingsHandler)
  router.put("/api/v1/instance-settings", putInstanceSettingsHandler)
}
