import { Request, Response } from "express";
import { DataFieldService } from "services/data-field";
import { UpdateDataFieldParams } from "@common/types";
import ApiResponseHandler from "api-response-handler";
import Error400BadRequest from "errors/error-400-bad-request";
import { AppDataSource } from "data-source";
import { ApiEndpoint } from "models";
import { getRiskScore } from "utils";

export const updateDataFieldHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { isRisk }: UpdateDataFieldParams = req.body;
    const { fieldId } = req.params;
    if (isRisk === null || isRisk === undefined) {
      throw new Error400BadRequest("isRisk not provided.");
    }
    const updatedDataField = await DataFieldService.updateIsRisk(
      isRisk,
      fieldId
    );
    if (updatedDataField) {
      const apiEndpointRepository = AppDataSource.getRepository(ApiEndpoint);
      const apiEndpoint = await apiEndpointRepository.findOne({
        where: {
          uuid: updatedDataField.apiEndpointUuid,
        },
        relations: {
          dataFields: true,
        },
      });
      apiEndpoint.riskScore = getRiskScore(apiEndpoint.dataFields);
      await apiEndpointRepository.save(apiEndpoint);
    }
    await ApiResponseHandler.success(res, updatedDataField);
  } catch (err) {
    await ApiResponseHandler.error(res, err);
  }
};
