import { Request, Response } from "express"
import { AlertService } from "services/alert"
import { GetAlertParams, UpdateAlertParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"

export const getAlertsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const alertParams: GetAlertParams = req.query
    const alerts = await AlertService.getAlerts(req.ctx, alertParams)
    await ApiResponseHandler.success(res, alerts)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const updateAlertHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { alertId } = req.params
    const updateAlertParams: UpdateAlertParams = req.body
    const updatedAlert = await AlertService.updateAlert(
      req.ctx,
      alertId,
      updateAlertParams,
    )
    await ApiResponseHandler.success(res, updatedAlert)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
