import { DataClass, PairObject } from "@common/types"
import { DataSection, DataType } from "@common/enums"
import { isParameter, parsedJson, parsedJsonNonNull } from "utils"
import { getPathTokens } from "@common/utils"
import { scanKey, scanValue } from "./scan"
import { getMapDataFields } from "services/data-field/utils"

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
  const detectedDataInValue = scanValue(dataValue, dataClasses)
  const detectedDataInPath = scanKey(dataPath, dataClasses)
  let newDataClasses = sensitiveDataMap[key] || []
  detectedDataInValue.forEach(e => {
    if (!newDataClasses.includes(e)) {
      newDataClasses.push(e)
    }
  })
  detectedDataInPath.forEach(e => {
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
  mapDataFields: string[],
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
        dataPathPrefix ? dataPathPrefix + ".[]" : "[]",
        dataSection,
        jsonBody[i],
        contentType,
        statusCode,
        sensitiveDataMap,
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
        dataClasses,
        dataPathPrefix ? dataPathPrefix + "." + res.key : res.key,
        dataSection,
        jsonBody[key],
        contentType,
        statusCode,
        sensitiveDataMap,
        res.filteredMapDataFields,
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
          dataClasses,
          "[]",
          dataSection,
          jsonBody[i],
          contentType,
          statusCode,
          sensitiveDataMap,
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
          dataClasses,
          res.key,
          dataSection,
          jsonBody[key],
          contentType,
          statusCode,
          sensitiveDataMap,
          res.filteredMapDataFields,
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
        mapDataFields,
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
  mapDataFields: string[],
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
        mapDataFields,
      )
    }
  }
}

export const findPathSensitiveData = (
  dataClasses: DataClass[],
  path: string,
  endpointPath: string,
  sensitiveDataMap: Record<string, string[]>,
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
        dataClasses,
        currToken.slice(1, -1),
        DataSection.REQUEST_PATH,
        tracePathTokens[i],
        "",
        -1,
        sensitiveDataMap,
        mapDataFields,
      )
    }
  }
}
