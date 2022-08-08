import { Request, Response } from "express";
import { SummaryService } from "../../services/summary";
import ApiResponseHandler from "../../api-response-handler";

export const getSummaryHandler = async (req: Request, res: Response) => {
  try {
    const summaryResponse = await SummaryService.getSummaryData();
    await ApiResponseHandler.success(res, summaryResponse);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
