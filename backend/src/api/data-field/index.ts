import { Response } from "express"
import { DataFieldService } from "services/data-field"
import { UpdateDataFieldClassesParams } from "@common/types"
import ApiResponseHandler from "api-response-handler"
import Error400BadRequest from "errors/error-400-bad-request"
import { GetEndpointsService } from "services/get-endpoints"
import { MetloRequest } from "types"

export const updateDataFieldClasses = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { dataFieldId } = req.params
    const { dataClasses, dataPath, dataSection }: UpdateDataFieldClassesParams =
      req.body
    if (!dataClasses) {
      throw new Error400BadRequest("No data class provided.")
    }
    if (!dataPath) {
      throw new Error400BadRequest("No data path provided.")
    }
    if (!dataSection) {
      throw new Error400BadRequest("No data section provided.")
    }
    const updatedDataField = await DataFieldService.updateDataClasses(
      req.ctx,
      dataFieldId,
      dataClasses,
      dataPath,
      dataSection,
    )
    if (updatedDataField) {
      await GetEndpointsService.updateEndpointRiskScore(
        req.ctx,
        updatedDataField.apiEndpointUuid,
      )
    }
    await ApiResponseHandler.success(res, updatedDataField)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}

export const deleteDataFieldHandler = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  try {
    const { dataFieldId } = req.params
    const removedDataField = await DataFieldService.deleteDataField(
      req.ctx,
      dataFieldId,
    )
    if (removedDataField) {
      await GetEndpointsService.updateEndpointRiskScore(
        req.ctx,
        removedDataField.apiEndpointUuid,
      )
    }
    await ApiResponseHandler.success(res, removedDataField)
  } catch (err) {
    await ApiResponseHandler.error(res, err)
  }
}
