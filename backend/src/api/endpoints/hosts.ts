import { Response } from "express"
import { GetEndpointsService } from "services/get-endpoints"
import { GetHostParamsSchema } from "@common/api/endpoint"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"
import Error400BadRequest from "errors/error-400-bad-request"

export const getHostsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const hosts = await GetEndpointsService.getHosts(req.ctx)
    await ApiResponseHandler.success(res, hosts)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
export const deleteHostHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { host } = req.body
    if (!host) {
      throw new Error400BadRequest("Must provide host.")
    }
    await GetEndpointsService.deleteHost(req.ctx, host)
    await ApiResponseHandler.success(res, "Success")
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getHostsListHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const parsedQuery = GetHostParamsSchema.safeParse(req.query)
  if (parsedQuery.success == false) {
    await ApiResponseHandler.error(
      res,
      new Error400BadRequest(parsedQuery.error.message),
    )
    return
  }
  try {
    const resp = await GetEndpointsService.getHostsList(
      req.ctx,
      parsedQuery.data,
    )
    await ApiResponseHandler.success(res, resp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
