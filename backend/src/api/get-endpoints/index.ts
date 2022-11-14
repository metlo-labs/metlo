import { Response } from "express"
import validator from "validator"
import { GetEndpointsService } from "services/get-endpoints"
import { GetEndpointParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import Error404NotFound from "errors/error-404-not-found"
import { MetloRequest } from "types"

export const getEndpointsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const getEndpointParams: GetEndpointParams = req.query
  try {
    const endpoints = await GetEndpointsService.getEndpoints(
      req.ctx,
      getEndpointParams,
    )
    await ApiResponseHandler.success(res, endpoints)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getEndpointHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { endpointId } = req.params
    if (!validator.isUUID(endpointId)) {
      throw new Error404NotFound("Endpoint does not exist.")
    }
    const endpoint = await GetEndpointsService.getEndpoint(req.ctx, endpointId)
    await ApiResponseHandler.success(res, endpoint)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

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

export const getUsageHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { endpointId } = req.params
    if (!validator.isUUID(endpointId)) {
      throw new Error404NotFound("Endpoint does not exist.")
    }
    const usageData = await GetEndpointsService.getUsage(req.ctx, endpointId)
    await ApiResponseHandler.success(res, usageData)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const updateEndpointIsAuthenticated = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { endpointId } = req.params
    const params: { authenticated: boolean } = req.body
    await GetEndpointsService.updateIsAuthenticated(
      req.ctx,
      endpointId,
      params.authenticated,
    )
    await ApiResponseHandler.success(res, "Success")
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
