import MIMEType from "whatwg-mimetype"
import { PairObject } from "@common/types"
import { DataSection, DataTag, DataType } from "@common/enums"
import { DataField } from "models"
import { MetloContext } from "types"
import { getDataType, isParameter, parsedJson, parsedJsonNonNull } from "utils"
import { getPathTokens } from "@common/utils"

interface ContentTypeResp {
  reqContentType: string
  resContentType: string
}

export interface DataFieldLength {
  numDataFields: number
}

const TOTAL_DATA_FIELDS_LIMIT = 200

const nonNullDataSections = [
  DataSection.REQUEST_BODY,
  DataSection.RESPONSE_BODY,
  DataSection.RESPONSE_HEADER,
]

export const UPDATE_DATA_FIELD_TIME_THRESHOLD =
  (parseInt(process.env.UPDATE_DATA_FIELD_TIME_THRESHOLD) || 86400) * 1000

export const getMapDataFields = (
  statusCode: number,
  contentType: string,
  dataSection: DataSection,
  dataPathPrefix: string,
  key: string,
  mapDataFields: string[],
): { key: string; filteredMapDataFields: string[] } => {
  const existingMapKey = `${statusCode}_${contentType}_${dataSection}${
    dataPathPrefix ? `.${dataPathPrefix}.[string]` : ".[string]"
  }`
  const existingMapKeyStrict = `${statusCode}_${contentType}_${dataSection}${
    dataPathPrefix ? `.${dataPathPrefix}.${key}` : `.${key}`
  }`
  let resKey = key
  const resFields = []
  mapDataFields.forEach(e => {
    const startsWith = e.startsWith(existingMapKey)
    if (startsWith || e.startsWith(existingMapKeyStrict)) {
      if (startsWith) {
        resKey = "[string]"
      }
      resFields.push(e)
    }
  })
  return { key: resKey, filteredMapDataFields: resFields }
}

export const getContentTypes = (
  requestHeaders: PairObject[],
  responseHeaders: PairObject[],
): ContentTypeResp => {
  let reqContentType = "*/*"
  let resContentType = "*/*"
  if (requestHeaders?.length > 0) {
    for (const requestHeader of requestHeaders) {
      const lower = requestHeader.name.toLowerCase()
      if (lower === "content-type") {
        try {
          reqContentType = new MIMEType(requestHeader.value)?.essence
          break
        } catch {}
      }
    }
  }
  if (responseHeaders?.length > 0) {
    for (const responseHeader of responseHeaders) {
      const lower = responseHeader.name.toLowerCase()
      if (lower === "content-type") {
        try {
          resContentType = new MIMEType(responseHeader.value)?.essence
          break
        } catch {}
      }
    }
  }
  return {
    reqContentType,
    resContentType,
  }
}

const handleDataField = (
  dataPath: string,
  dataSection: DataSection,
  apiEndpointUuid: string,
  dataValue: any,
  contentType: string,
  statusCode: number,
  dataFieldLength: DataFieldLength,
  dataFieldMap: Record<string, DataField>,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, DataField>,
  traceTime: Date,
) => {
  let existingDataField: DataField = null
  let isNullKey = null
  const key = `${statusCode}_${contentType}_${dataSection}${
    dataPath ? `.${dataPath}` : ""
  }`
  const existingNullKey = `-1__${dataSection}${dataPath ? `.${dataPath}` : ""}`
  if (dataFieldMap[key]) {
    existingDataField = dataFieldMap[key]
    isNullKey = false
  } else if (dataFieldMap[existingNullKey]) {
    existingDataField = dataFieldMap[existingNullKey]
    isNullKey = true
  }
  const dataType = getDataType(dataValue)

  if (!existingDataField) {
    if (dataFieldLength.numDataFields >= TOTAL_DATA_FIELDS_LIMIT) {
      return
    }
    const dataField = DataField.create()
    dataField.dataPath = dataPath ?? ""
    dataField.dataType = dataType
    dataField.dataSection = dataSection
    dataField.apiEndpointUuid = apiEndpointUuid
    dataField.contentType = contentType ?? ""
    dataField.statusCode = statusCode ?? -1
    dataField.isNullable = dataType === DataType.UNKNOWN
    dataField.dataClasses = []
    dataField.scannerIdentified = []
    dataField.falsePositives = []
    dataField.createdAt = traceTime
    dataField.updatedAt = traceTime
    dataField.lastSeen = traceTime
    if (dataField.dataClasses.length > 0) {
      dataField.dataTag = DataTag.PII
    }
    dataFieldLength.numDataFields += 1
    dataFieldMap[key] = dataField
    newDataFieldMap[key] = dataField
  } else {
    let updated = false
    if (
      isNullKey &&
      nonNullDataSections.includes(existingDataField.dataSection)
    ) {
      updated = true
      if (existingDataField.dataSection === DataSection.REQUEST_BODY) {
        existingDataField.contentType = contentType ?? ""
      } else if (
        existingDataField.dataSection === DataSection.RESPONSE_HEADER
      ) {
        existingDataField.statusCode = statusCode ?? -1
      } else if (existingDataField.dataSection === DataSection.RESPONSE_BODY) {
        existingDataField.contentType = contentType ?? ""
        existingDataField.statusCode = statusCode ?? -1
      }
    }

    if (!existingDataField.isNullable && dataType === DataType.UNKNOWN) {
      existingDataField.isNullable = true
      updated = true
    }

    if (
      existingDataField.dataType !== dataType &&
      traceTime > existingDataField.updatedAt &&
      dataType !== DataType.UNKNOWN
    ) {
      existingDataField.dataType = dataType
      updated = true
    }

    if (
      traceTime.getTime() - existingDataField.lastSeen.getTime() >
      UPDATE_DATA_FIELD_TIME_THRESHOLD
    ) {
      updated = true
    }

    if (updated) {
      existingDataField.updatedAt = traceTime
      existingDataField.lastSeen = traceTime
      if (isNullKey) {
        dataFieldMap[existingNullKey] = existingDataField
        updatedDataFieldMap[existingNullKey] = existingDataField
      } else if (isNullKey === false) {
        dataFieldMap[key] = existingDataField
        updatedDataFieldMap[key] = existingDataField
      }
    }
  }
}

const recursiveParseJson = (
  ctx: MetloContext,
  dataPathPrefix: string,
  dataSection: DataSection,
  jsonBody: any,
  apiEndpointUuid: string,
  contentType: string,
  statusCode: number,
  dataFieldMap: Record<string, DataField>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, DataField>,
  traceTime: Date,
  mapDataFields: string[],
) => {
  if (Object(jsonBody) !== jsonBody) {
    handleDataField(
      dataPathPrefix,
      dataSection,
      apiEndpointUuid,
      jsonBody,
      contentType,
      statusCode,
      dataFieldLength,
      dataFieldMap,
      newDataFieldMap,
      updatedDataFieldMap,
      traceTime,
    )
  } else if (jsonBody && Array.isArray(jsonBody)) {
    let l = jsonBody.length
    for (let i = 0; i < l; i++) {
      recursiveParseJson(
        ctx,
        dataPathPrefix ? dataPathPrefix + ".[]" : "[]",
        dataSection,
        jsonBody[i],
        apiEndpointUuid,
        contentType,
        statusCode,
        dataFieldMap,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
        mapDataFields,
      )
    }
  } else if (typeof jsonBody === DataType.OBJECT) {
    for (const key in jsonBody) {
      const res = getMapDataFields(
        statusCode,
        contentType,
        dataSection,
        dataPathPrefix,
        key,
        mapDataFields,
      )
      recursiveParseJson(
        ctx,
        dataPathPrefix ? dataPathPrefix + "." + res.key : res.key,
        dataSection,
        jsonBody[key],
        apiEndpointUuid,
        contentType,
        statusCode,
        dataFieldMap,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
        res.filteredMapDataFields,
      )
    }
  }
}

export const findBodyDataFields = (
  ctx: MetloContext,
  dataSection: DataSection,
  body: string,
  apiEndpointUuid: string,
  contentType: string,
  statusCode: number,
  dataFieldMap: Record<string, DataField>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, DataField>,
  traceTime: Date,
  mapDataFields: string[],
) => {
  if (!body && dataSection === DataSection.RESPONSE_BODY) {
    body = ""
  }
  const jsonBody = parsedJsonNonNull(body, true)
  if (jsonBody || dataSection === DataSection.RESPONSE_BODY) {
    if (Array.isArray(jsonBody)) {
      const l = jsonBody.length
      for (let i = 0; i < l; i++) {
        recursiveParseJson(
          ctx,
          "[]",
          dataSection,
          jsonBody[i],
          apiEndpointUuid,
          contentType,
          statusCode,
          dataFieldMap,
          dataFieldLength,
          newDataFieldMap,
          updatedDataFieldMap,
          traceTime,
          mapDataFields,
        )
      }
    } else if (typeof jsonBody === DataType.OBJECT) {
      for (let key in jsonBody) {
        const res = getMapDataFields(
          statusCode,
          contentType,
          dataSection,
          null,
          key,
          mapDataFields,
        )
        recursiveParseJson(
          ctx,
          res.key,
          dataSection,
          jsonBody[key],
          apiEndpointUuid,
          contentType,
          statusCode,
          dataFieldMap,
          dataFieldLength,
          newDataFieldMap,
          updatedDataFieldMap,
          traceTime,
          res.filteredMapDataFields,
        )
      }
    } else {
      recursiveParseJson(
        ctx,
        null,
        dataSection,
        jsonBody,
        apiEndpointUuid,
        contentType,
        statusCode,
        dataFieldMap,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
        mapDataFields,
      )
    }
  }
}

export const findPairObjectDataFields = (
  ctx: MetloContext,
  dataSection: DataSection,
  data: PairObject[],
  apiEndpointUuid: string,
  contentType: string,
  statusCode: number,
  dataFieldMap: Record<string, DataField>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, DataField>,
  traceTime: Date,
  mapDataFields: string[],
) => {
  if (data) {
    for (const item of data) {
      const field = item.name
      const jsonBody = parsedJson(item.value)
      recursiveParseJson(
        ctx,
        field,
        dataSection,
        jsonBody ?? item.value,
        apiEndpointUuid,
        contentType,
        statusCode,
        dataFieldMap,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
        mapDataFields,
      )
    }
  }
}

export const findPathDataFields = (
  ctx: MetloContext,
  path: string,
  endpointPath: string,
  apiEndpointUuid: string,
  dataFieldMap: Record<string, DataField>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, DataField>,
  traceTime: Date,
  mapDataFields: string[],
) => {
  if (!path || !endpointPath) {
    return
  }
  const tracePathTokens = getPathTokens(path)
  const endpointPathTokens = getPathTokens(endpointPath)
  if (tracePathTokens.length !== endpointPathTokens.length) {
    return
  }
  for (let i = 0; i < endpointPathTokens.length; i++) {
    const currToken = endpointPathTokens[i]
    if (isParameter(currToken)) {
      recursiveParseJson(
        ctx,
        currToken.slice(1, -1),
        DataSection.REQUEST_PATH,
        tracePathTokens[i],
        apiEndpointUuid,
        "",
        -1,
        dataFieldMap,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
        mapDataFields,
      )
    }
  }
}
