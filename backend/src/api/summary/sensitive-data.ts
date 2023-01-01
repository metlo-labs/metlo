import { Response } from "express"
import { GetSensitiveDataAggParamsSchema } from "@common/api/summary"
import ApiResponseHandler from "api-response-handler"
import { getPIIDataTypeAgg } from "services/summary/piiData"
import { MetloRequest } from "types"
import Error400BadRequest from "errors/error-400-bad-request"

export const getSensitiveDataSummaryHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const parsedQuery = GetSensitiveDataAggParamsSchema.safeParse(req.query)
  if (parsedQuery.success == false) {
    await ApiResponseHandler.error(
      res,
      new Error400BadRequest(parsedQuery.error.message),
    )
    return
  }
  try {
    const out = await getPIIDataTypeAgg(req.ctx, parsedQuery.data)
    await ApiResponseHandler.success(res, out)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
