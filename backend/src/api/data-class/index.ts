import { Request, Response } from "express";
import { DataClassService } from "services/data-class";
import { UpdatePIIFieldParams } from "@common/types";
import ApiResponseHandler from "api-response-handler";
import Error400BadRequest from "errors/error-400-bad-request";
import { AppDataSource } from "data-source";
import { ApiEndpoint } from "models";
import { getRiskScore } from "utils";

export const updatePIIFieldHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { isRisk }: UpdatePIIFieldParams = req.body;
    const { piiFieldId } = req.params;
    if (isRisk === null || isRisk === undefined) {
      throw new Error400BadRequest("isRisk not provided.");
    }
    const updatedMatchedDataClass = await DataClassService.updateIsRisk(
      isRisk,
      piiFieldId
    );
    if (updatedMatchedDataClass) {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
      const apiEndpoint = await apiEndpointRepository.findOne({
        where: { uuid: updatedMatchedDataClass.apiEndpointUuid },
        relations: { sensitiveDataClasses: true },
      });
      apiEndpoint.riskScore = getRiskScore(apiEndpoint);
      await apiEndpointRepository.save(apiEndpoint);
    }
    await ApiResponseHandler.success(res, updatedMatchedDataClass);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
