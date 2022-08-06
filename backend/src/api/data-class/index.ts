import { Request, Response } from "express";
import { DataClassService } from "../../services/data-class";
import { IsRiskParams } from "../../types";
import ApiResponseHandler from "../../api-response-handler";
import Error400BadRequest from "../../errors/error-400-bad-request";

export const isRiskHandler = async (req: Request, res: Response) => {
  try {
    const { isRisk }: IsRiskParams = req.body;
    const { dataClassId } = req.params;
    if (isRisk === null || isRisk === undefined) {
      throw new Error400BadRequest("isRisk not provided.");
    }
    await DataClassService.updateIsRisk(isRisk, dataClassId);
    await ApiResponseHandler.success(res, null);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
