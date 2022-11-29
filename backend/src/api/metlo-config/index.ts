import { Response } from "express"
import { UpdateMetloConfigParams } from "@common/types"
import { getMetloConfig, updateMetloConfig } from "services/metlo-config"
import ApiResponseHandler from "api-response-handler"
import Error404NotFound from "errors/error-404-not-found"
import { MetloRequest } from "types"

export const updateMetloConfigHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const updateMetloConfigParams: UpdateMetloConfigParams = req.body
    await updateMetloConfig(req.ctx, updateMetloConfigParams)
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
