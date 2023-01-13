import crypto from "crypto"
import { QueuedApiTrace } from "@common/types"
import { DataSection, DataTag, DataType } from "@common/enums"
import { ApiEndpoint, DataField } from "models"
import { MetloContext } from "types"
import { getRiskScore } from "utils"
import {
  getUniqueDataClasses,
  isArrayFieldsDiff,
  getContentTypes,
  findPathDataFields,
  findPairObjectDataFields,
  findBodyDataFields,
} from "./utils"

const nonNullDataSections = [
  DataSection.REQUEST_BODY,
  DataSection.RESPONSE_BODY,
  DataSection.RESPONSE_HEADER,
]

const TOTAL_DATA_FIELDS_LIMIT = 200

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

const getTraceDataFieldMap = async (
  ctx: MetloContext,
  apiTrace: QueuedApiTrace,
  apiEndpointPath: string,
  apiEndpointUuid: string,
  traceHashObj: Record<string, Set<string>>,
) => {
  const statusCode = apiTrace.responseStatus
  const { reqContentType, resContentType } = getContentTypes(
    apiTrace.requestHeaders,
    apiTrace.responseHeaders,
  )

  const dataFieldMap: Record<string, DataField> = {}
  await findPathDataFields(
    ctx,
    apiTrace.path,
    apiEndpointPath,
    apiEndpointUuid,
    dataFieldMap,
    traceHashObj,
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
  )
  return dataFieldMap
}

const findDiffDataFields = (
  currentDataFieldMap: Record<string, DataField>,
  traceDataFieldMap: Record<string, DataField>,
  hash: string,
  traceTime: Date,
  currNumDataFields: number,
) => {
  const newDataFields: DataField[] = []
  const updatedExistingFields: DataField[] = []
  for (const key in traceDataFieldMap) {
    const traceDataField = traceDataFieldMap[key]
    const existingNullKey = `-1__${traceDataField.dataSection}${
      traceDataField.dataPath ? `.${traceDataField.dataPath}` : ""
    }`
    let existingDataField: DataField = null
    let isNullKey = null
    if (currentDataFieldMap[key]) {
      existingDataField = currentDataFieldMap[key]
      isNullKey = false
    } else if (currentDataFieldMap[existingNullKey]) {
      existingDataField = currentDataFieldMap[existingNullKey]
      isNullKey = true
    }
    if (existingDataField) {
      let updated = false
      if (
        isNullKey &&
        nonNullDataSections.includes(traceDataField.dataSection)
      ) {
        updated = true
        if (traceDataField.dataSection === DataSection.REQUEST_BODY) {
          existingDataField.contentType = traceDataField.contentType
        } else if (traceDataField.dataSection === DataSection.RESPONSE_HEADER) {
          existingDataField.statusCode = traceDataField.statusCode
        } else if (traceDataField.dataSection === DataSection.RESPONSE_BODY) {
          existingDataField.contentType = traceDataField.contentType
          existingDataField.statusCode = traceDataField.statusCode
        }
      }

      const classes = getUniqueDataClasses(existingDataField, traceDataField)
      if (classes.updated) {
        updated = true
        existingDataField.dataClasses = [...classes.dataClasses]
        existingDataField.scannerIdentified = [...classes.scannerIdentified]
        if (
          existingDataField.dataClasses.length > 0 &&
          existingDataField.dataTag !== DataTag.PII
        ) {
          existingDataField.dataTag = DataTag.PII
        } else if (
          existingDataField.dataClasses.length === 0 &&
          existingDataField.dataTag !== null
        ) {
          existingDataField.dataTag = null
        }
      }

      if (
        traceTime > existingDataField.updatedAt &&
        isArrayFieldsDiff(
          existingDataField.arrayFields,
          traceDataField.arrayFields,
        )
      ) {
        existingDataField.arrayFields = { ...traceDataField.arrayFields }
        updated = true
      }

      if (!existingDataField.isNullable && traceDataField.isNullable) {
        existingDataField.isNullable = true
        updated = true
      }

      if (
        existingDataField.dataType !== traceDataField.dataType &&
        traceTime > existingDataField.updatedAt &&
        traceDataField.dataType !== DataType.UNKNOWN
      ) {
        existingDataField.dataType = traceDataField.dataType
        updated = true
      }

      if (
        updated ||
        !existingDataField.traceHash[hash] ||
        traceTime.getTime() - existingDataField.traceHash[hash] > 60_000
      ) {
        existingDataField.updatedAt = traceTime
        existingDataField.traceHash[hash] = traceTime.getTime()

        updatedExistingFields.push(existingDataField)
        if (isNullKey) {
          currentDataFieldMap[existingNullKey] = existingDataField
        } else if (isNullKey === false) {
          currentDataFieldMap[key] = existingDataField
        }
      }
    } else {
      if (++currNumDataFields <= TOTAL_DATA_FIELDS_LIMIT) {
        traceDataField.traceHash = { [hash]: traceTime.getTime() }
        traceDataField.createdAt = traceTime
        traceDataField.updatedAt = traceTime
        newDataFields.push(traceDataField)
      }
    }
  }
  return { newDataFields, updatedExistingFields }
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
  const traceDataFieldMap = await getTraceDataFieldMap(
    ctx,
    apiTrace,
    apiEndpoint?.path,
    apiEndpoint?.uuid,
    traceHashObj,
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

  const { newDataFields, updatedExistingFields } = findDiffDataFields(
    currentDataFieldMap,
    traceDataFieldMap,
    hash,
    apiTrace.createdAt,
    currNumDataFields,
  )

  apiEndpoint.riskScore = getRiskScore(
    newDataFields.concat(Object.values(currentDataFieldMap) ?? []),
  )
  return { newFields: newDataFields, updatedFields: updatedExistingFields }
}
