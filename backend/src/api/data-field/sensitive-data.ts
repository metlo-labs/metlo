import { Response } from "express"
import { GetSensitiveDataAggParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import { getPIIDataTypeAgg } from "services/summary/piiData"
import { MetloRequest } from "types"

export const getSensitiveDataSummaryHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const params: GetSensitiveDataAggParams = req.query
    const out = await getPIIDataTypeAgg(req.ctx, params)
    await ApiResponseHandler.success(res, out)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
