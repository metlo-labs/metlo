import { Request, Response } from "express"
import { GetEndpointsService } from "services/get-endpoints"
import { GetEndpointParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"

export const getEndpointsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const getEndpointParams: GetEndpointParams = req.query
  try {
    const endpoints = await GetEndpointsService.getEndpoints(getEndpointParams)
    await ApiResponseHandler.success(res, endpoints)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getEndpointHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { endpointId } = req.params
    const endpoint = await GetEndpointsService.getEndpoint(endpointId)
    await ApiResponseHandler.success(res, endpoint)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getHostsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const hosts = await GetEndpointsService.getHosts()
    await ApiResponseHandler.success(res, hosts)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getUsageHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { endpointId } = req.params
    const usageData = await GetEndpointsService.getUsage(endpointId)
    await ApiResponseHandler.success(res, usageData)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
