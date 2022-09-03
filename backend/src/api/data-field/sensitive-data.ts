import { Request, Response } from "express"
import { GetSensitiveDataAggParams, SensitiveDataSummary } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import { getPIIDataTypeAgg } from "services/summary/piiData"

export const getSensitiveDataSummaryHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const params: GetSensitiveDataAggParams = req.query
    const out = await getPIIDataTypeAgg(params)
    await ApiResponseHandler.success(res, out)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
