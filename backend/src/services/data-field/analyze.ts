import crypto from "crypto"
import { QueuedApiTrace } from "@common/types"
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
  UpdatedDataField,
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

const findAllDataFields = async (
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
  const { reqContentType, resContentType } = getContentTypes(
    apiTrace.requestHeaders,
    apiTrace.responseHeaders,
  )

  await findPathDataFields(
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
  if (statusCode < 400) {
    await findPairObjectDataFields(
      ctx,
      DataSection.REQUEST_QUERY,
      apiTrace.requestParameters,
      apiEndpointUuid,
      "",
      -1,
      dataFieldMap,
      traceHashObj,
      dataFieldLength,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
    )
    await findPairObjectDataFields(
      ctx,
      DataSection.REQUEST_HEADER,
      apiTrace.requestHeaders,
      apiEndpointUuid,
      "",
      -1,
      dataFieldMap,
      traceHashObj,
      dataFieldLength,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
    )
    await findBodyDataFields(
      ctx,
      DataSection.REQUEST_BODY,
      apiTrace.requestBody,
      apiEndpointUuid,
      reqContentType,
      -1,
      dataFieldMap,
      traceHashObj,
      dataFieldLength,
      newDataFieldMap,
      updatedDataFieldMap,
      apiTrace.createdAt,
    )
  }
  await findPairObjectDataFields(
    ctx,
    DataSection.RESPONSE_HEADER,
    apiTrace.responseHeaders,
    apiEndpointUuid,
    "",
    statusCode,
    dataFieldMap,
    traceHashObj,
    dataFieldLength,
    newDataFieldMap,
    updatedDataFieldMap,
    apiTrace.createdAt,
  )
  await findBodyDataFields(
    ctx,
    DataSection.RESPONSE_BODY,
    apiTrace.responseBody,
    apiEndpointUuid,
    resContentType,
    statusCode,
    dataFieldMap,
    traceHashObj,
    dataFieldLength,
    newDataFieldMap,
    updatedDataFieldMap,
    apiTrace.createdAt,
  )
}

export const findDataFieldsToSave = async (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
  apiEndpoint: ApiEndpoint,
) => {
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
  await findAllDataFields(
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
  const newDataFields: DataField[] = []
  const updatedDataFields: DataField[] = []

  for (const key in newDataFieldMap) {
    newDataFieldMap[key].traceHash = { [hash]: currentTimestamp }
    newDataFields.push(newDataFieldMap[key])
  }

  for (const key in updatedDataFieldMap) {
    const currDataField = updatedDataFieldMap[key].dataField
    if (
      updatedDataFieldMap[key].updated ||
      !currDataField.traceHash[hash] ||
      currentTimestamp - currDataField.traceHash[hash] > 60_000
    ) {
      currDataField.traceHash[hash] = currentTimestamp
      updatedDataFields.push(currDataField)
    }
  }

  apiEndpoint.riskScore = getRiskScore(Object.values(currentDataFieldMap) ?? [])

  return { newFields: newDataFields, updatedFields: updatedDataFields }
}
