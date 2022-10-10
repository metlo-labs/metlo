import { Request, Response } from "express"
import validator from "validator"
import { GetEndpointsService } from "services/get-endpoints"
import { GetEndpointParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import Error404NotFound from "errors/error-404-not-found"

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
    if (!validator.isUUID(endpointId)) {
      throw new Error404NotFound("Endpoint does not exist.")
    }
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
    if (!validator.isUUID(endpointId)) {
      throw new Error404NotFound("Endpoint does not exist.")
    }
    const usageData = await GetEndpointsService.getUsage(endpointId)
    await ApiResponseHandler.success(res, usageData)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const updateEndpointIsAuthenticated = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { endpointId } = req.params
    const params: { authenticated: boolean } = req.body
    await GetEndpointsService.updateIsAuthenticated(
      endpointId,
      params.authenticated,
    )
    await ApiResponseHandler.success(res)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
