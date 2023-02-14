import { DataClass, PairObject } from "@common/types"
import { DataSection, DataType } from "@common/enums"
import { isParameter, parsedJson, parsedJsonNonNull } from "utils"
import { getPathTokens } from "@common/utils"
import { scan } from "./scan"
import { getContentTypeStatusCode } from "services/data-field/utils"

const handleDataField = (
  dataClasses: DataClass[],
  dataPath: string,
  dataSection: DataSection,
  dataValue: any,
  contentType: string,
  statusCode: number,
  sensitiveDataMap: Record<string, string[]>,
) => {
  const key = `${statusCode}_${contentType}_${dataSection}${
    dataPath ? `.${dataPath}` : ""
  }`
  const detectedData = scan(dataValue, dataClasses)
  let newDataClasses = sensitiveDataMap[key] || []
  detectedData.forEach(e => {
    if (!newDataClasses.includes(e)) {
      newDataClasses.push(e)
    }
  })
  sensitiveDataMap[key] = newDataClasses
}

const recursiveParseJson = (
  dataClasses: DataClass[],
  dataPathPrefix: string,
  dataSection: DataSection,
  jsonBody: any,
  contentType: string,
  statusCode: number,
  sensitiveDataMap: Record<string, string[]>,
) => {
  if (Object(jsonBody) !== jsonBody) {
    handleDataField(
      dataClasses,
      dataPathPrefix,
      dataSection,
      jsonBody,
      contentType,
      statusCode,
      sensitiveDataMap,
    )
  } else if (jsonBody && Array.isArray(jsonBody)) {
    let l = jsonBody.length
    for (let i = 0; i < l; i++) {
      recursiveParseJson(
        dataClasses,
        dataPathPrefix,
        dataSection,
        jsonBody[i],
        contentType,
        statusCode,
        sensitiveDataMap,
      )
    }
  } else if (typeof jsonBody === DataType.OBJECT) {
    for (const key in jsonBody) {
      recursiveParseJson(
        dataClasses,
        dataPathPrefix ? dataPathPrefix + "." + key : key,
        dataSection,
        jsonBody[key],
        contentType,
        statusCode,
        sensitiveDataMap,
      )
    }
  }
}

export const findBodySensitiveData = (
  dataClasses: DataClass[],
  dataSection: DataSection,
  body: string,
  contentType: string,
  statusCode: number,
  sensitiveDataMap: Record<string, string[]>,
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
          dataClasses,
          null,
          dataSection,
          jsonBody[i],
          contentType,
          statusCode,
          sensitiveDataMap,
        )
      }
    } else if (typeof jsonBody === DataType.OBJECT) {
      for (let key in jsonBody) {
        recursiveParseJson(
          dataClasses,
          key,
          dataSection,
          jsonBody[key],
          contentType,
          statusCode,
          sensitiveDataMap,
        )
      }
    } else {
      recursiveParseJson(
        dataClasses,
        null,
        dataSection,
        jsonBody,
        contentType,
        statusCode,
        sensitiveDataMap,
      )
    }
  }
}

export const findPairObjectSensitiveData = (
  dataClasses: DataClass[],
  dataSection: DataSection,
  data: PairObject[],
  contentType: string,
  statusCode: number,
  sensitiveDataMap: Record<string, string[]>,
) => {
  if (data) {
    for (const item of data) {
      const field = item.name
      const jsonBody = parsedJson(item.value)
      recursiveParseJson(
        dataClasses,
        field,
        dataSection,
        jsonBody ?? item.value,
        contentType,
        statusCode,
        sensitiveDataMap,
      )
    }
  }
}

export const findPathSensitiveData = (
  dataClasses: DataClass[],
  path: string,
  endpointPath: string,
  sensitiveDataMap: Record<string, string[]>,
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
        dataClasses,
        currToken.slice(1, -1),
        DataSection.REQUEST_PATH,
        tracePathTokens[i],
        "",
        -1,
        sensitiveDataMap,
      )
    }
  }
}

export const getSensitiveDataFieldDataFromProcessedData = (
  dataPath: string,
  requestContentType: string,
  responseContentType: string,
  statusCode: number,
) => {
  let currPath = ""
  const splitPath = dataPath.split(".")
  const dataSection = splitPath[0] as DataSection
  let updated = false
  for (let i = 1; i < splitPath.length; i++) {
    const token = splitPath[i]
    if (token.length > 1 && token[0] === "[" && token[1] === "]") {
      continue
    }
    if (updated) {
      currPath += `.${token}`
    } else {
      currPath += token
      updated = true
    }
  }
  const info = getContentTypeStatusCode(
    dataSection,
    requestContentType,
    responseContentType,
    statusCode,
  )
  return {
    dataPath: currPath,
    contentType: info.contentType,
    statusCode: info.statusCode,
    dataSection,
  }
}

export const addDataFieldToSensitiveDataMap = (
  dataPath: string,
  dataSection: DataSection,
  contentType: string,
  statusCode: number,
  detectedData: string[],
  sensitiveDataMap: Record<string, string[]>,
) => {
  const key = `${statusCode}_${contentType}_${dataSection}${
    dataPath ? `.${dataPath}` : ""
  }`
  let newDataClasses = sensitiveDataMap[key] || []
  detectedData.forEach(e => {
    if (!newDataClasses.includes(e)) {
      newDataClasses.push(e)
    }
  })
  sensitiveDataMap[key] = newDataClasses
}
