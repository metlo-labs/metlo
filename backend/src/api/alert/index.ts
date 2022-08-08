import { Request, Response } from "express";
import { AlertService } from "../../services/alert";
import { GetAlertParams } from "../../types";
import ApiResponseHandler from "../../api-response-handler";

export const getAlertsHandler = async (req: Request, res: Response) => {
  try {
    const alertParams: GetAlertParams = req.query;
    const alerts = await AlertService.getAlerts(alertParams);
    await ApiResponseHandler.success(res, alerts);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};

export const resolveAlertHandler = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { resolutionMessage } = req.body;
    await AlertService.resolveAlert(alertId, resolutionMessage);
    await ApiResponseHandler.success(res, null);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
