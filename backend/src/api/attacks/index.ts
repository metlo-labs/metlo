import { Request, Response } from "express"
import ApiResponseHandler from "api-response-handler"
import { hasValidLicense } from "utils/license"
import { AttackService } from "services/attacks"
import { AttackDetailResponse, AttackResponse, GetAttackParams } from "@common/types"
import Error400BadRequest from "errors/error-400-bad-request"

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
        attackTypeCount: {},
        totalEndpoints: 0,
        totalAttacks: 0,
      } as AttackResponse)
      return
    }
    const attackResp = await AttackService.getAttacks(getAttackParams)
    await ApiResponseHandler.success(res, attackResp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getAttackHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { attackId } = req.params
    const validLicense = await hasValidLicense()
    if (!validLicense) {
      await ApiResponseHandler.success(res, {
        validLicense,
        attack: null,
        traces: []
      } as AttackDetailResponse)
    }
    if (!attackId) {
      throw new Error400BadRequest("No attack id specified.")
    }
    const attackDetailResp = await AttackService.getAttack(attackId)
    await ApiResponseHandler.success(res, attackDetailResp)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
