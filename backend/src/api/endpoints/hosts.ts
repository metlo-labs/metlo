import { Response } from "express"
import { GetEndpointsService } from "services/get-endpoints"
import {
  GetHostParamsSchema,
  DeleteHostsParamsSchema,
} from "@common/api/endpoint"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"

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
export const deleteHostsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const parsedBody = DeleteHostsParamsSchema.safeParse(req.body)
    if (parsedBody.success === false) {
      return await ApiResponseHandler.zerr(res, parsedBody.error)
    }
    await GetEndpointsService.deleteHosts(req.ctx, parsedBody.data)
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
    return await ApiResponseHandler.zerr(res, parsedQuery.error)
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
