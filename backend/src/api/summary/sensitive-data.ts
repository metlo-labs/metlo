import { Response } from "express"
import { GetSensitiveDataAggParamsSchema } from "@common/api/summary"
import ApiResponseHandler from "api-response-handler"
import { getPIIDataTypeAgg } from "services/summary/piiData"
import { MetloRequest } from "types"

export const getSensitiveDataSummaryHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const parsedQuery = GetSensitiveDataAggParamsSchema.safeParse(req.query)
  if (parsedQuery.success == false) {
    return await ApiResponseHandler.zerr(res, parsedQuery.error)
  }
  try {
    const out = await getPIIDataTypeAgg(req.ctx, parsedQuery.data)
    await ApiResponseHandler.success(res, out)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
