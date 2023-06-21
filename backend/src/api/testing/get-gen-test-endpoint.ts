import { Response } from "express"
import ApiResponseHandler from "api-response-handler"
import Error400BadRequest from "errors/error-400-bad-request"
import { MetloRequest } from "types"
import { getGenTestEndpoint, getGenTestEndpoints } from "services/testing/utils"
import Error404NotFound from "errors/error-404-not-found"

export const getGenTestEndpointHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const queryParams: { endpoint?: string; host?: string; method?: string } =
    req.query
  if (!queryParams.endpoint) {
    return await ApiResponseHandler.error(
      res,
      new Error400BadRequest("No endpoint specified."),
    )
  }
  try {
    const endpoint = await getGenTestEndpoint(
      req.ctx,
      queryParams.endpoint,
      queryParams.host,
      queryParams.method,
    )
    if (!endpoint) {
      return await ApiResponseHandler.error(
        res,
        new Error404NotFound("Could not find endpoint."),
      )
    }
    await ApiResponseHandler.success(res, endpoint)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getGenTestEndpointsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const queryParams: { host?: string } = req.query
  if (!queryParams.host) {
    return await ApiResponseHandler.error(
      res,
      new Error400BadRequest("No host specified."),
    )
  }
  try {
    const endpoints = await getGenTestEndpoints(req.ctx, queryParams.host)
    await ApiResponseHandler.success(res, endpoints)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
