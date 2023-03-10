import crypto from "crypto"
import { DataClass, QueuedApiTrace } from "@common/types"
import { DataSection } from "@common/enums"
import { ApiEndpoint, DataField } from "models"
import { MetloContext } from "types"
import { getRiskScore } from "utils"
import { findPathDataFields } from "services/data-field/utils"
import {
  DataFieldLength,
  getDataFieldDataFromProcessedData,
  handleDataField,
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
  isGraphQl: boolean,
) => {
  const statusCode = apiTrace.responseStatus
  const reqContentType = apiTrace?.processedTraceData?.requestContentType ?? ""
  const resContentType = apiTrace?.processedTraceData?.responseContentType ?? ""
  const processedDataFields = apiTrace?.processedTraceData?.dataTypes ?? []

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
  for (const dataField in processedDataFields) {
    const info = getDataFieldDataFromProcessedData(
      dataField,
      processedDataFields[dataField],
      apiEndpointUuid,
      reqContentType,
      resContentType,
      statusCode ?? -1,
      mapDataFields,
    )
    handleDataField(
      info.dataPath,
      info.dataSection,
      info.apiEndpointUuid,
      info.dataType,
      info.contentType,
      info.statusCode,
      dataFieldLength,
      dataFieldMap,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
      isGraphQl,
    )
  }
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
    apiEndpoint.isGraphQl,
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
