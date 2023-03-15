import { DataSection, DataTag, DataType } from "@common/enums"
import { DataField } from "models"
import { getMapDataFields, UPDATE_DATA_FIELD_TIME_THRESHOLD } from "../utils"

export interface DataFieldLength {
  numDataFields: number
}

interface ProcessedDataFieldData {
  dataPath: string
  dataSection: DataSection
  dataType: DataType
  contentType: string
  statusCode: number
  isNullable: boolean
  apiEndpointUuid: string
}

const TOTAL_DATA_FIELDS_LIMIT = 200
const TOTAL_DATA_FIELDS_LIMIT_GRAPHQL = 250
const getTotalDataFieldsLimit = (isGraphQl: boolean) => {
  return isGraphQl ? TOTAL_DATA_FIELDS_LIMIT_GRAPHQL : TOTAL_DATA_FIELDS_LIMIT
}

const nonNullDataSections = [
  DataSection.REQUEST_BODY,
  DataSection.RESPONSE_BODY,
  DataSection.RESPONSE_HEADER,
]

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
  mapDataFields: string[],
): ProcessedDataFieldData => {
  const res: ProcessedDataFieldData = {
    dataPath: "",
    dataSection: null,
    dataType: DataType.UNKNOWN,
    contentType: "",
    statusCode: -1,
    isNullable: false,
    apiEndpointUuid,
  }

  const splitPath = dataPath.split(".")
  let tmpMapDataFields = [...mapDataFields]
  res.dataSection = splitPath.shift() as DataSection

  const info = getContentTypeStatusCode(
    res.dataSection,
    requestContentType,
    responseContentType,
    statusCode,
  )

  for (const path of splitPath) {
    let response = {
      key: path,
      filteredMapDataFields: null,
    }
    if (path !== "[]") {
      response = getMapDataFields(
        info.statusCode,
        info.contentType,
        res.dataSection,
        res.dataPath || null,
        path,
        tmpMapDataFields,
      )
    }
    if (res.dataPath.length === 0) {
      res.dataPath += response.key
    } else {
      res.dataPath += `.${response.key}`
    }
    if (response.filteredMapDataFields) {
      tmpMapDataFields = response.filteredMapDataFields
    }
  }

  for (const item of dataTypes) {
    if (item === "null") {
      res.isNullable = true
    } else {
      res.dataType = item as DataType
    }
  }

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
  dataFieldLength: DataFieldLength,
  dataFieldMap: Record<string, DataField>,
  newDataFieldMap: Record<string, DataField>,
  updatedDataFieldMap: Record<string, DataField>,
  traceTime: Date,
  isGraphQl: boolean,
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

  if (!existingDataField) {
    if (dataFieldLength.numDataFields >= getTotalDataFieldsLimit(isGraphQl)) {
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
