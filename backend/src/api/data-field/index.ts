import { Request, Response } from "express"
import { DataFieldService } from "services/data-field"
import { IgnoreDataClassParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import Error400BadRequest from "errors/error-400-bad-request"
import { GetEndpointsService } from "services/get-endpoints"

export const ignoreDataClassHandler = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { dataFieldId } = req.params
    const { dataClass, dataPath, dataSection }: IgnoreDataClassParams = req.body
    if (!dataClass) {
      throw new Error400BadRequest("No data class provided.")
    }
    if (!dataPath) {
      throw new Error400BadRequest("No data path provided.")
    }
    if (!dataSection) {
      throw new Error400BadRequest("No data section provided.")
    }
    const updatedDataField = await DataFieldService.ignoreDataClass(
      dataFieldId,
      dataClass,
      dataPath,
      dataSection,
    )
    if (updatedDataField) {
      await GetEndpointsService.updateEndpointRiskScore(
        updatedDataField.apiEndpointUuid,
      )
    }
    await ApiResponseHandler.success(res, updatedDataField)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
