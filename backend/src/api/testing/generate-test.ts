import { Response } from "express"
import ApiResponseHandler from "api-response-handler"
import Error400BadRequest from "errors/error-400-bad-request"
import { GenerateTestParams } from "@common/types"
import { generateTest } from "services/testing/generate-test"
import { MetloRequest } from "types"

export const generateTestHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const queryParams: Partial<GenerateTestParams> = req.query
  if (!queryParams.endpoint) {
    return await ApiResponseHandler.error(
      res,
      new Error400BadRequest("No endpoint specified."),
    )
  }
  if (!queryParams.type) {
    return await ApiResponseHandler.error(
      res,
      new Error400BadRequest("No type specified."),
    )
  }
  const params = queryParams as GenerateTestParams
  try {
    const test = await generateTest(req.ctx, params)
    await ApiResponseHandler.success(res, test)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
