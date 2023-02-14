import { DataSection, DataTag, DataType } from "@common/enums"
import { DataField } from "models"

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

export const handleDataField = (
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
