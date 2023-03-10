import { DataClass, QueuedApiTrace } from "@common/types"
import { DataSection } from "@common/enums"
import { ApiEndpoint, DataField } from "models"
import { MetloContext } from "types"
import { getRiskScore } from "utils"
import {
  getContentTypes,
  findPathDataFields,
  findPairObjectDataFields,
  findBodyDataFields,
  DataFieldLength,
} from "./utils"

const getCurrentDataFieldsMap = (
  dataFields: DataField[],
): [Record<string, DataField>, string[], number] => {
  let currNumDataFields = 0
  const res = {}
  const mapDataFields = []
  dataFields.forEach(item => {
    currNumDataFields += 1
    const key = `${item.statusCode}_${item.contentType}_${item.dataSection}${
      item.dataPath ? `.${item.dataPath}` : ""
    }`
    res[key] = item
    if (item.dataPath.includes("[string]")) {
      mapDataFields.push(key)
    }
  })
  return [res, mapDataFields, currNumDataFields]
}

const findAllDataFields = (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
  apiEndpointPath: string,
  apiEndpointUuid: string,
  dataFieldLength: DataFieldLength,
  dataFieldMap: Record<string, DataField>,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, DataField>,
  mapDataFields: string[],
) => {
  const statusCode = apiTrace.responseStatus
  const { reqContentType, resContentType } = getContentTypes(
    apiTrace.requestHeaders,
    apiTrace.responseHeaders,
  )

  findPathDataFields(
    ctx,
    apiTrace.path,
    apiEndpointPath,
    apiEndpointUuid,
    dataFieldMap,
    dataFieldLength,
    newDataFieldMap,
    updatedDataFieldMap,
    apiTrace.createdAt,
    mapDataFields,
  )
  if (statusCode < 400) {
    findPairObjectDataFields(
      ctx,
      DataSection.REQUEST_QUERY,
      apiTrace.requestParameters,
      apiEndpointUuid,
      "",
      -1,
      dataFieldMap,
      dataFieldLength,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
      mapDataFields,
    )
    findPairObjectDataFields(
      ctx,
      DataSection.REQUEST_HEADER,
      apiTrace.requestHeaders,
      apiEndpointUuid,
      "",
      -1,
      dataFieldMap,
      dataFieldLength,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
      mapDataFields,
    )
    findBodyDataFields(
      ctx,
      DataSection.REQUEST_BODY,
      apiTrace.requestBody,
      apiEndpointUuid,
      reqContentType,
      -1,
      dataFieldMap,
      dataFieldLength,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
      mapDataFields,
    )
  }
  findPairObjectDataFields(
    ctx,
    DataSection.RESPONSE_HEADER,
    apiTrace.responseHeaders,
    apiEndpointUuid,
    "",
    statusCode,
    dataFieldMap,
    dataFieldLength,
    newDataFieldMap,
    updatedDataFieldMap,
    apiTrace.createdAt,
    mapDataFields,
  )
  findBodyDataFields(
    ctx,
    DataSection.RESPONSE_BODY,
    apiTrace.responseBody,
    apiEndpointUuid,
    resContentType,
    statusCode,
    dataFieldMap,
    dataFieldLength,
    newDataFieldMap,
    updatedDataFieldMap,
    apiTrace.createdAt,
    mapDataFields,
  )
}

export const findDataFieldsToSave = (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
  apiEndpoint: ApiEndpoint,
  dataClasses: DataClass[],
): { dataFields: DataField[]; mapDataFields: string[] } => {
  const [currentDataFieldMap, mapDataFields, currNumDataFields] =
    getCurrentDataFieldsMap(apiEndpoint.dataFields)
  const newDataFieldMap: Record<string, DataField> = {}
  const updatedDataFieldMap: Record<string, DataField> = {}
  const dataFieldLength: DataFieldLength = { numDataFields: currNumDataFields }
  findAllDataFields(
    ctx,
    apiTrace,
    apiEndpoint?.path,
    apiEndpoint?.uuid,
    dataFieldLength,
    currentDataFieldMap,
    newDataFieldMap,
    updatedDataFieldMap,
    mapDataFields,
  )

  const resDataFields: DataField[] = Object.values(newDataFieldMap).concat(
    Object.values(updatedDataFieldMap),
  )

  apiEndpoint.riskScore = getRiskScore(
    Object.values(currentDataFieldMap) ?? [],
    dataClasses,
  )

  return { dataFields: resDataFields, mapDataFields }
}
