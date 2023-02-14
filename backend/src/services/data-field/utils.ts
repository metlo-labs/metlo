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

export interface UpdatedDataField {
  dataField: DataField
  updated: boolean
}

interface ProcessedDataFieldData {
  dataPath: string
  dataSection: DataSection
  dataType: DataType
  contentType: string
  statusCode: number
  arrayFields: Record<string, number>
  isNullable: boolean
  apiEndpointUuid: string
}

const TOTAL_DATA_FIELDS_LIMIT = 200

const nonNullDataSections = [
  DataSection.REQUEST_BODY,
  DataSection.RESPONSE_BODY,
  DataSection.RESPONSE_HEADER,
]

export const UPDATE_DATA_FIELD_TIME_THRESHOLD =
  (parseInt(process.env.UPDATE_DATA_FIELD_TIME_THRESHOLD) || 60) * 1000

export const isArrayFieldsDiff = (
  oldFields: Record<string, number>,
  newFields: Record<string, number>,
): boolean => {
  if ((oldFields && !newFields) || (!oldFields && newFields)) {
    return true
  }
  const newFieldKeys = Object.keys(newFields)
  const oldFieldKeys = Object.keys(oldFields)
  if (newFieldKeys.length !== oldFieldKeys.length) {
    return true
  }
  return newFieldKeys.some(e => !oldFields[e] || oldFields[e] !== newFields[e])
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

const updateTraceHashObj = (
  dataSection: DataSection,
  dataPath: string,
  arrayFields: Record<string, number>,
  traceHashObj: Record<string, Set<string>>,
) => {
  if (dataSection === DataSection.REQUEST_PATH) {
    return
  }
  const arrayFieldsKeys = Object.keys(arrayFields)
  const arrayFieldsLen = arrayFieldsKeys.length
  const sortedArrayFields = arrayFieldsKeys
    .sort()
    .reduce((acc: string, key: string, idx: number) => {
      acc += `${key}#${arrayFields[key]}${idx < arrayFieldsLen - 1 ? "::" : ""}`
      return acc
    }, "")
  const key =
    (dataPath ?? "") + (sortedArrayFields ? `<>${sortedArrayFields}` : "")
  traceHashObj[dataSection].add(key)
}

const handleDataField = (
  dataPath: string,
  dataSection: DataSection,
  apiEndpointUuid: string,
  dataValue: any,
  contentType: string,
  statusCode: number,
  arrayFields: Record<string, number>,
  traceHashObj: Record<string, Set<string>>,
  dataFieldLength: DataFieldLength,
  dataFieldMap: Record<string, DataField>,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, UpdatedDataField>,
  traceTime: Date,
) => {
  updateTraceHashObj(dataSection, dataPath, arrayFields, traceHashObj)
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
    dataField.traceHash = {}
    dataField.contentType = contentType ?? ""
    dataField.statusCode = statusCode ?? -1
    dataField.isNullable = dataType === DataType.UNKNOWN
    dataField.arrayFields = { ...arrayFields }
    dataField.dataClasses = []
    dataField.scannerIdentified = []
    dataField.falsePositives = []
    dataField.createdAt = traceTime
    dataField.updatedAt = traceTime
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

    if (
      traceTime > existingDataField.updatedAt &&
      isArrayFieldsDiff(existingDataField.arrayFields, arrayFields)
    ) {
      existingDataField.arrayFields = { ...arrayFields }
      updated = true
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

    existingDataField.updatedAt = traceTime
    if (isNullKey) {
      dataFieldMap[existingNullKey] = existingDataField
      updatedDataFieldMap[existingNullKey] = {
        dataField: existingDataField,
        updated,
      }
    } else if (isNullKey === false) {
      dataFieldMap[key] = existingDataField
      updatedDataFieldMap[key] = {
        dataField: existingDataField,
        updated,
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
  arrayFields: Record<string, number>,
  dataFieldMap: Record<string, DataField>,
  traceHashObj: Record<string, Set<string>>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, UpdatedDataField>,
  traceTime: Date,
) => {
  if (Object(jsonBody) !== jsonBody) {
    handleDataField(
      dataPathPrefix,
      dataSection,
      apiEndpointUuid,
      jsonBody,
      contentType,
      statusCode,
      arrayFields,
      traceHashObj,
      dataFieldLength,
      dataFieldMap,
      newDataFieldMap,
      updatedDataFieldMap,
      traceTime,
    )
  } else if (jsonBody && Array.isArray(jsonBody)) {
    let l = jsonBody.length
    const arrayFieldKey = dataPathPrefix ?? ""
    if (arrayFields[arrayFieldKey]) {
      arrayFields[arrayFieldKey] += 1
    } else {
      arrayFields[arrayFieldKey] = 1
    }
    for (let i = 0; i < l; i++) {
      recursiveParseJson(
        ctx,
        dataPathPrefix,
        dataSection,
        jsonBody[i],
        apiEndpointUuid,
        contentType,
        statusCode,
        { ...arrayFields },
        dataFieldMap,
        traceHashObj,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
      )
    }
  } else if (typeof jsonBody === DataType.OBJECT) {
    for (const key in jsonBody) {
      recursiveParseJson(
        ctx,
        dataPathPrefix ? dataPathPrefix + "." + key : key,
        dataSection,
        jsonBody[key],
        apiEndpointUuid,
        contentType,
        statusCode,
        { ...arrayFields },
        dataFieldMap,
        traceHashObj,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
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
  traceHashObj: Record<string, Set<string>>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, UpdatedDataField>,
  traceTime: Date,
) => {
  if (!body && dataSection === DataSection.RESPONSE_BODY) {
    body = ""
  }
  const jsonBody = parsedJsonNonNull(body, true)
  if (jsonBody || dataSection === DataSection.RESPONSE_BODY) {
    if (Array.isArray(jsonBody)) {
      const l = jsonBody.length
      const arrayFields = {
        "": 1,
      }
      for (let i = 0; i < l; i++) {
        recursiveParseJson(
          ctx,
          null,
          dataSection,
          jsonBody[i],
          apiEndpointUuid,
          contentType,
          statusCode,
          { ...arrayFields },
          dataFieldMap,
          traceHashObj,
          dataFieldLength,
          newDataFieldMap,
          updatedDataFieldMap,
          traceTime,
        )
      }
    } else if (typeof jsonBody === DataType.OBJECT) {
      for (let key in jsonBody) {
        recursiveParseJson(
          ctx,
          key,
          dataSection,
          jsonBody[key],
          apiEndpointUuid,
          contentType,
          statusCode,
          {},
          dataFieldMap,
          traceHashObj,
          dataFieldLength,
          newDataFieldMap,
          updatedDataFieldMap,
          traceTime,
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
        {},
        dataFieldMap,
        traceHashObj,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
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
  traceHashObj: Record<string, Set<string>>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, UpdatedDataField>,
  traceTime: Date,
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
        {},
        dataFieldMap,
        traceHashObj,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
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
  traceHashObj: Record<string, Set<string>>,
  dataFieldLength: DataFieldLength,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, UpdatedDataField>,
  traceTime: Date,
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
        {},
        dataFieldMap,
        traceHashObj,
        dataFieldLength,
        newDataFieldMap,
        updatedDataFieldMap,
        traceTime,
      )
    }
  }
}

export const getContentTypeStatusCode = (
  dataSection: DataSection,
  requestContentType: string,
  responseContentType: string,
  statusCode: number,
) => {
  switch (dataSection) {
    case DataSection.REQUEST_BODY:
      return { contentType: requestContentType, statusCode: -1 }
    case DataSection.RESPONSE_HEADER:
      return { contentType: "", statusCode }
    case DataSection.RESPONSE_BODY:
      return { contentType: responseContentType, statusCode }
    case DataSection.REQUEST_PATH:
    case DataSection.REQUEST_QUERY:
    case DataSection.REQUEST_HEADER:
    default:
      return { contentType: "", statusCode: -1 }
  }
}

export const getDataFieldDataFromProcessedData = (
  dataPath: string,
  dataTypes: string[],
  apiEndpointUuid: string,
  requestContentType: string,
  responseContentType: string,
  statusCode: number,
): ProcessedDataFieldData => {
  const res: ProcessedDataFieldData = {
    dataPath: "",
    dataSection: null,
    dataType: DataType.UNKNOWN,
    contentType: "",
    statusCode: -1,
    arrayFields: {},
    isNullable: false,
    apiEndpointUuid,
  }
  const splitPath = dataPath.split(".")
  res.dataSection = splitPath[0] as DataSection
  let currDataPath = ""
  let updated = false
  for (let i = 1; i < splitPath.length; i++) {
    const token = splitPath[i]
    if (token.length > 1 && token[0] === "[" && token[1] === "]") {
      const arrayDepth = token.split("[").length - 1
      res.arrayFields[currDataPath] = arrayDepth
    } else {
      if (updated) {
        currDataPath += `.${token}`
      } else {
        currDataPath += token
        updated = true
      }
    }
  }
  res.dataPath = currDataPath
  for (const item of dataTypes) {
    if (item === "null") {
      res.isNullable = true
    } else {
      res.dataType = item as DataType
    }
  }
  const info = getContentTypeStatusCode(
    res.dataSection,
    requestContentType,
    responseContentType,
    statusCode,
  )
  res.contentType = info.contentType
  res.statusCode = info.statusCode
  return res
}

export const handleDataFieldV2 = (
  dataPath: string,
  dataSection: DataSection,
  apiEndpointUuid: string,
  dataType: DataType,
  contentType: string,
  statusCode: number,
  arrayFields: Record<string, number>,
  traceHashObj: Record<string, Set<string>>,
  dataFieldLength: DataFieldLength,
  dataFieldMap: Record<string, DataField>,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, UpdatedDataField>,
  traceTime: Date,
) => {
  updateTraceHashObj(dataSection, dataPath, arrayFields, traceHashObj)
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

  if (!existingDataField) {
    if (dataFieldLength.numDataFields >= TOTAL_DATA_FIELDS_LIMIT) {
      return
    }
    const dataField = DataField.create()
    dataField.dataPath = dataPath ?? ""
    dataField.dataType = dataType
    dataField.dataSection = dataSection
    dataField.apiEndpointUuid = apiEndpointUuid
    dataField.traceHash = {}
    dataField.contentType = contentType ?? ""
    dataField.statusCode = statusCode ?? -1
    dataField.isNullable = dataType === DataType.UNKNOWN
    dataField.arrayFields = { ...arrayFields }
    dataField.dataClasses = []
    dataField.scannerIdentified = []
    dataField.falsePositives = []
    dataField.createdAt = traceTime
    dataField.updatedAt = traceTime
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

    if (
      traceTime > existingDataField.updatedAt &&
      isArrayFieldsDiff(existingDataField.arrayFields, arrayFields)
    ) {
      existingDataField.arrayFields = { ...arrayFields }
      updated = true
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

    existingDataField.updatedAt = traceTime
    if (isNullKey) {
      dataFieldMap[existingNullKey] = existingDataField
      updatedDataFieldMap[existingNullKey] = {
        dataField: existingDataField,
        updated,
      }
    } else if (isNullKey === false) {
      dataFieldMap[key] = existingDataField
      updatedDataFieldMap[key] = {
        dataField: existingDataField,
        updated,
      }
    }
  }
}
