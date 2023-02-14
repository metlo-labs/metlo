import mlog from "logger"
import { Response } from "express"
import { TraceParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"
import { logRequest, logRequestBatch } from "services/log-request/v2"

export const logRequestSingleHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  mlog.debug("Called Log Request Single Handler V2")
  const traceParams: TraceParams = req.body
  try {
    await logRequest(req.ctx, traceParams)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const logRequestBatchHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  mlog.debug("Called Log Request Batch Handler")
  const traceParamsBatch: TraceParams[] = req.body
  try {
    await logRequestBatch(req.ctx, traceParamsBatch)
    await ApiResponseHandler.success(res, null)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
