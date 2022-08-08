import { Request, Response } from "express";
import ApiResponseHandler from "../../api-response-handler";

export const getSummaryHandler = async (req: Request, res: Response) => {
  await ApiResponseHandler.success(res, {
    highRiskAlerts: 3,
    newAlerts: 10,
    endpointsTracked: 82,
    piiDataFields: 22,
  });
};
