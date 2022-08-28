import { Request, Response } from "express"
import { AlertService } from "services/alert"
import { GetAlertParams, UpdateAlertParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"

export const getAlertsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const alertParams: GetAlertParams = req.query
    const alerts = await AlertService.getAlerts(alertParams)
    await ApiResponseHandler.success(res, alerts)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const updateAlertHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { alertId } = req.params
    const updateAlertParams: UpdateAlertParams = req.body
    const updatedAlert = await AlertService.updateAlert(alertId, updateAlertParams)
    await ApiResponseHandler.success(res, updatedAlert)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const getTopAlertsHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const topAlerts = await AlertService.getTopAlerts()
    await ApiResponseHandler.success(res, topAlerts)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
