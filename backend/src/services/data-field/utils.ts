import MIMEType from "whatwg-mimetype"
import { PairObject } from "@common/types"
import { DataSection, DataTag, DataType } from "@common/enums"
import { DataField } from "models"
import { MetloContext } from "types"
import { scan } from "services/scanner/scan"
import { getDataType, isParameter, parsedJson, parsedJsonNonNull } from "utils"
import { getPathTokens } from "@common/utils"

interface ContentTypeResp {
  reqContentType: string
  resContentType: string
}

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

export const getUniqueDataClasses = (
  existingDataField: DataField,
  newDataField: DataField,
) => {
  const classes: Record<"dataClasses" | "scannerIdentified", string[]> = {
    dataClasses: [...existingDataField.dataClasses],
    scannerIdentified: [...existingDataField.scannerIdentified],
  }
  let updated = false
  const newDataClasses = newDataField.dataClasses
  for (const dataClass of newDataClasses) {
    if (
      !classes.dataClasses.includes(dataClass) &&
      !existingDataField.falsePositives.includes(dataClass)
    ) {
      classes.dataClasses.push(dataClass)
      classes.scannerIdentified.push(dataClass)
      updated = true
    }
  }
  return { ...classes, updated }
}

export const getContentTypes = (
  requestHeaders: PairObject[],
  responseHeaders: PairObject[],
): ContentTypeResp => {
  let reqContentType = "*/*"
  let resContentType = "*/*"
  for (const requestHeader of requestHeaders) {
    const lower = requestHeader.name.toLowerCase()
    if (lower === "content-type") {
      try {
        reqContentType = new MIMEType(requestHeader.value)?.essence
        break
      } catch {}
    }
  }
  for (const responseHeader of responseHeaders) {
    const lower = responseHeader.name.toLowerCase()
    if (lower === "content-type") {
      try {
        resContentType = new MIMEType(responseHeader.value)?.essence
        break
      } catch {}
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

const createDataField = (
  dataClasses: string[],
  dataPath: string,
  dataSection: DataSection,
  apiEndpointUuid: string,
  dataValue: any,
  contentType: string,
  statusCode: number,
  arrayFields: Record<string, number>,
  traceHashObj: Record<string, Set<string>>,
) => {
  updateTraceHashObj(dataSection, dataPath, arrayFields, traceHashObj)
  const dataType = getDataType(dataValue)
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
  dataField.dataClasses = dataClasses
  dataField.scannerIdentified = dataClasses
  dataField.falsePositives = []
  if (dataField.dataClasses.length > 0) {
    dataField.dataTag = DataTag.PII
  }
  return dataField
}

const recursiveParseJson = async (
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
) => {
  if (Object(jsonBody) !== jsonBody) {
    const dataClasses = await scan(ctx, jsonBody)
    const dataField = createDataField(
      dataClasses,
      dataPathPrefix,
      dataSection,
      apiEndpointUuid,
      jsonBody,
      contentType,
      statusCode,
      arrayFields,
      traceHashObj,
    )
    const key = `${dataField.statusCode}_${
      dataField.contentType
    }_${dataSection}${dataPathPrefix ? `.${dataPathPrefix}` : ""}`
    dataFieldMap[key] = dataField
  } else if (jsonBody && Array.isArray(jsonBody)) {
    let l = jsonBody.length
    const arrayFieldKey = dataPathPrefix ?? ""
    if (arrayFields[arrayFieldKey]) {
      arrayFields[arrayFieldKey] += 1
    } else {
      arrayFields[arrayFieldKey] = 1
    }
    for (let i = 0; i < l; i++) {
      await recursiveParseJson(
        ctx,
        dataPathPrefix,
        dataSection,
        jsonBody[i],
        apiEndpointUuid,
        contentType,
        statusCode,
        arrayFields,
        dataFieldMap,
        traceHashObj,
      )
    }
  } else if (typeof jsonBody === DataType.OBJECT) {
    for (const key in jsonBody) {
      await recursiveParseJson(
        ctx,
        dataPathPrefix ? dataPathPrefix + "." + key : key,
        dataSection,
        jsonBody[key],
        apiEndpointUuid,
        contentType,
        statusCode,
        arrayFields,
        dataFieldMap,
        traceHashObj,
      )
    }
  }
}

export const findBodyDataFields = async (
  ctx: MetloContext,
  dataSection: DataSection,
  body: string,
  apiEndpointUuid: string,
  contentType: string,
  statusCode: number,
  dataFieldMap: Record<string, DataField>,
  traceHashObj: Record<string, Set<string>>,
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
        await recursiveParseJson(
          ctx,
          null,
          dataSection,
          jsonBody[i],
          apiEndpointUuid,
          contentType,
          statusCode,
          arrayFields,
          dataFieldMap,
          traceHashObj,
        )
      }
    } else if (typeof jsonBody === DataType.OBJECT) {
      for (let key in jsonBody) {
        await recursiveParseJson(
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
        )
      }
    } else {
      await recursiveParseJson(
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
      )
    }
  }
}

export const findPairObjectDataFields = async (
  ctx: MetloContext,
  dataSection: DataSection,
  data: PairObject[],
  apiEndpointUuid: string,
  contentType: string,
  statusCode: number,
  dataFieldMap: Record<string, DataField>,
  traceHashObj: Record<string, Set<string>>,
) => {
  if (data) {
    for (const item of data) {
      const field = item.name
      const jsonBody = parsedJson(item.value)
      await recursiveParseJson(
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
      )
    }
  }
}

export const findPathDataFields = async (
  ctx: MetloContext,
  path: string,
  endpointPath: string,
  apiEndpointUuid: string,
  dataFieldMap: Record<string, DataField>,
  traceHashObj: Record<string, Set<string>>,
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
      await recursiveParseJson(
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
      )
    }
  }
}
