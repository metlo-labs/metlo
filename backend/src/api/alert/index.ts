import { Response, Router } from "express"
import { AlertService } from "services/alert"
import {
  GetAlertParamsSchema,
  UpdateAlertParamsSchema,
} from "@common/api/alert"
import ApiResponseHandler from "api-response-handler"
import { MetloRequest } from "types"

export const getAlertsHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const parsedQuery = GetAlertParamsSchema.safeParse(req.query)
  if (parsedQuery.success == false) {
    return await ApiResponseHandler.zerr(res, parsedQuery.error)
  }
  try {
    const alerts = await AlertService.getAlerts(req.ctx, parsedQuery.data)
    await ApiResponseHandler.success(res, alerts)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const updateAlertHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { alertId } = req.params
  const parsedBody = UpdateAlertParamsSchema.safeParse(req.body)
  if (parsedBody.success == false) {
    return await ApiResponseHandler.zerr(res, parsedBody.error)
  }
  try {
    const updatedAlert = await AlertService.updateAlert(
      req.ctx,
      alertId,
      parsedBody.data,
    )
    await ApiResponseHandler.success(res, updatedAlert)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export default function registerAlertRoutes(router: Router) {
  router.get("/api/v1/alerts", getAlertsHandler)
  router.put("/api/v1/alert/:alertId", updateAlertHandler)
}
