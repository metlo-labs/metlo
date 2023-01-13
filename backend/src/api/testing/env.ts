import ApiResponseHandler from "api-response-handler"
import { getGlobalEnvService } from "../../services/testing/env"
import { MetloRequest } from "types"
import { Response } from "express"

export async function getGlobalEnv(req: MetloRequest, res: Response) {
  try {
    const env = await getGlobalEnvService(req.ctx)
    if (env) return await ApiResponseHandler.success(res, env as object)
    return await ApiResponseHandler.success(res, [])
  } catch (err) {
    return await ApiResponseHandler.success(res, [])
  }
}
