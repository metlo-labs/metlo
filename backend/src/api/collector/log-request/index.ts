import { Response } from "express"
import { LogRequestService } from "services/log-request"
import { TraceParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"

export const logRequestSingleHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const traceParams: TraceParams = req.body
  try {
    await LogRequestService.logRequest(req.ctx, traceParams)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const logRequestBatchHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const traceParamsBatch: TraceParams[] = req.body
  try {
    await LogRequestService.logRequestBatch(req.ctx, traceParamsBatch)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
