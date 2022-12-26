import { Response } from "express"
import { getSummaryData } from "services/summary"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"

export const getSummaryHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const summaryResponse = await getSummaryData(req.ctx)
    await ApiResponseHandler.success(res, summaryResponse)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}