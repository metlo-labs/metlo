import crypto from "crypto"
import { QueuedApiTrace } from "@common/types"
import { DataSection } from "@common/enums"
import { ApiEndpoint, DataField } from "models"
import { MetloContext } from "types"
import { getRiskScore } from "utils"
import { findPathDataFields } from "services/data-field/utils"
import {
  DataFieldLength,
  UpdatedDataField,
  UPDATE_DATA_FIELD_TIME_THRESHOLD,
  getDataFieldDataFromProcessedData,
  handleDataField,
} from "./utils"

const getCurrentDataFieldsMap = (
  dataFields: DataField[],
): [Record<string, DataField>, number] => {
  let currNumDataFields = 0
  const res = {}
  dataFields.forEach(item => {
    currNumDataFields += 1
    res[
      `${item.statusCode}_${item.contentType}_${item.dataSection}${
        item.dataPath ? `.${item.dataPath}` : ""
      }`
    ] = item
  })
  return [res, currNumDataFields]
}

const findAllDataFields = (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
  apiEndpointPath: string,
  apiEndpointUuid: string,
  traceHashObj: Record<string, Set<string>>,
  dataFieldLength: DataFieldLength,
  dataFieldMap: Record<string, DataField>,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, UpdatedDataField>,
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
    traceHashObj,
    dataFieldLength,
    newDataFieldMap,
    updatedDataFieldMap,
    apiTrace.createdAt,
  )
  for (const dataField in processedDataFields) {
    const info = getDataFieldDataFromProcessedData(
      dataField,
      processedDataFields[dataField],
      apiEndpointUuid,
      reqContentType,
      resContentType,
      statusCode ?? -1,
    )
    handleDataField(
      info.dataPath,
      info.dataSection,
      info.apiEndpointUuid,
      info.dataType,
      info.contentType,
      info.statusCode,
      info.arrayFields,
      traceHashObj,
      dataFieldLength,
      dataFieldMap,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
    )
  }
}

export const findDataFieldsToSave = async (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
  apiEndpoint: ApiEndpoint,
): Promise<DataField[]> => {
  const traceHashObj: Record<string, Set<string>> = {
    [DataSection.REQUEST_HEADER]: new Set<string>([]),
    [DataSection.REQUEST_QUERY]: new Set<string>([]),
    [DataSection.REQUEST_BODY]: new Set<string>([]),
    [DataSection.RESPONSE_HEADER]: new Set<string>([]),
    [DataSection.RESPONSE_BODY]: new Set<string>([]),
  }
  const [currentDataFieldMap, currNumDataFields] = getCurrentDataFieldsMap(
    apiEndpoint.dataFields,
  )
  const newDataFieldMap: Record<string, DataField> = {}
  const updatedDataFieldMap: Record<string, UpdatedDataField> = {}
  const dataFieldLength: DataFieldLength = { numDataFields: currNumDataFields }
  findAllDataFields(
    ctx,
    apiTrace,
    apiEndpoint?.path,
    apiEndpoint?.uuid,
    traceHashObj,
    dataFieldLength,
    currentDataFieldMap,
    newDataFieldMap,
    updatedDataFieldMap,
  )

  let traceHashArray = []
  const sortedTraceHashObjKeys = Object.keys(traceHashObj).sort()
  for (const section of sortedTraceHashObjKeys) {
    traceHashArray = traceHashArray.concat([...traceHashObj[section]].sort())
  }
  const hash = crypto
    .createHash("sha256")
    .update(traceHashArray.join())
    .digest("base64")
  const currentTimestamp = apiTrace.createdAt.getTime()
  const resDataFields: DataField[] = []

  for (const key in newDataFieldMap) {
    newDataFieldMap[key].traceHash = { [hash]: currentTimestamp }
    resDataFields.push(newDataFieldMap[key])
  }

  for (const key in updatedDataFieldMap) {
    const currDataField = updatedDataFieldMap[key].dataField
    if (
      updatedDataFieldMap[key].updated ||
      !currDataField.traceHash?.[hash] ||
      currentTimestamp - currDataField.traceHash?.[hash] >
        UPDATE_DATA_FIELD_TIME_THRESHOLD
    ) {
      currDataField.traceHash[hash] = currentTimestamp
      resDataFields.push(currDataField)
    }
  }

  apiEndpoint.riskScore = await getRiskScore(
    ctx,
    Object.values(currentDataFieldMap) ?? [],
  )

  return resDataFields
}
