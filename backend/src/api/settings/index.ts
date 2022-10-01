import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { AppDataSource } from "data-source"
import { InstanceSettings } from "models"

export const getInstanceSettingsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const instanceSettingsRepository =
      AppDataSource.getRepository(InstanceSettings)
    const instanceSettings = await instanceSettingsRepository.findOne({
      where: {},
    })
    await ApiResponseHandler.success(res, instanceSettings)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const putInstanceSettingsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, skip } = req.body
    const instanceSettingsRepository =
      AppDataSource.getRepository(InstanceSettings)
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
