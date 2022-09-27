import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { hasValidLicense } from "utils/license"
import { getAttacks } from "services/attacks"
import { GetAttackParams } from "@common/types"

export const getAttacksHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const getAttackParams: GetAttackParams = req.query
    const validLicense = await hasValidLicense()
    if (!validLicense) {
      await ApiResponseHandler.success(res, {
        validLicense,
        attacks: [],
        totalAttacks: 0,
      })
      return
    }
    const attackResp = await getAttacks(getAttackParams)
    await ApiResponseHandler.success(res, attackResp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
