import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { hasValidLicense } from "utils/license"

export const getAttacksHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const validLicense = await hasValidLicense()
    await ApiResponseHandler.success(res, {
      validLicense,
      attacks: [],
    })
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
