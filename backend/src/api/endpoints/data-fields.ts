import { Response } from "express"
import { updateDataClasses, deleteDataField } from "services/data-field"
import { UpdateDataFieldClassesParamsSchema } from "@common/api/endpoint"
import ApiResponseHandler from "api-response-handler"
import { GetEndpointsService } from "services/get-endpoints"
import { MetloRequest } from "types"

export const updateDataFieldClasses = async (
  req: MetloRequest,
  res: Response,
): Promise<void> => {
  const { dataFieldId } = req.params
  const parsedBody = UpdateDataFieldClassesParamsSchema.safeParse(req.body)
  if (parsedBody.success == false) {
    return await ApiResponseHandler.zerr(res, parsedBody.error)
  }
  try {
    const { dataClasses, dataPath, dataSection } = parsedBody.data
    const updatedDataField = await updateDataClasses(
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
    const removedDataField = await deleteDataField(req.ctx, dataFieldId)
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
