import ApiResponseHandler from "api-response-handler"
import { Response } from "express"
import { getHostGraph } from "services/get-endpoints/graph"
import { MetloRequest } from "types"

export const getHostsGraphHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const resp = await getHostGraph(req.ctx)
    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}