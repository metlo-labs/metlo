import MIMEType from "whatwg-mimetype"
import { ApiTrace, DataField } from "@common/types"
import { DataSection } from "@common/enums"

export interface NumSensitiveData {
  pathTokens: string[]
  arrayFields: Record<string, number>
  dataSection: DataSection
}

export type SensitiveDataMap = Record<string, [string, string[]][]>

export type NumSensitiveDataMap = Record<string, Map<string, number>>

const getMimeType = (contentType: string) => {
  try {
    return new MIMEType(contentType)
  } catch (err) {
    return null
  }
}

const concatString = (
  currString: string,
  token: string,
  isRegexString: boolean,
) => {
  if (isRegexString) {
    if (currString.endsWith(String.raw`\.`) || !currString) {
      return String.raw`${currString}${token}`
    } else {
      return String.raw`${currString}\.${token}`
    }
  } else {
    if (currString.endsWith(".") || !currString) {
      return String.raw`${currString}${token}`
    } else {
      return String.raw`${currString}.${token}`
    }
  }
}

const getSensitiveDataRegex = (
  pathTokens: string[],
  arrayFields: Record<string, number>,
  providedPrefix?: string,
  skipArray?: boolean,
) => {
  let replacedString = ""
  let fullString = providedPrefix ?? ""

  if (arrayFields[fullString]) {
    if (providedPrefix) {
      replacedString += String.raw`\.`
    }
    const depth = arrayFields[fullString]
    for (let i = 0; i < depth; i++) {
      replacedString += "[0-9]+"
      if (i !== depth - 1 || pathTokens?.[0]) {
        replacedString += String.raw`\.`
      }
    }
  }

  if (pathTokens[0] === "") {
    return replacedString
  }

  for (let j = 0; j < pathTokens.length; j++) {
    const token = pathTokens[j]
    if (!token) {
      continue
    }

    if (providedPrefix && j === 0 && !replacedString) {
      replacedString = concatString(replacedString, String.raw`\.`, true)
    }
    fullString = concatString(fullString, token, false)
    replacedString = concatString(replacedString, token, true)
    if (!skipArray && arrayFields[fullString]) {
      const depth = arrayFields[fullString]
      for (let i = 0; i < depth; i++) {
        replacedString = concatString(replacedString, String.raw`[0-9]+`, true)
      }
    }
  }
  return replacedString
}

const getPairObjectData = (dataSection: DataSection, trace: ApiTrace) => {
  switch (dataSection) {
    case DataSection.REQUEST_QUERY:
      return trace.requestParameters
    case DataSection.REQUEST_HEADER:
      return trace.requestHeaders
    case DataSection.RESPONSE_HEADER:
      return trace.responseHeaders
    default:
      return []
  }
}

const getContentTypes = (trace: ApiTrace) => {
  let reqContentType = "*/*"
  let respContentType = "*/*"
  trace.requestHeaders.forEach(e => {
    if (e.name.toLowerCase() == "content-type") {
      const mimeType = getMimeType(e.value)
      if (mimeType.essence) {
        reqContentType = mimeType.essence
      }
    }
  })
  trace.responseHeaders.forEach(e => {
    if (e.name.toLowerCase() == "content-type") {
      const mimeType = getMimeType(e.value)
      if (mimeType.essence) {
        respContentType = mimeType
      }
    }
  })
  return { reqContentType, respContentType }
}

const getNumSensitiveData = (
  numSensitiveData: NumSensitiveData[],
  numSensitiveDataMap: NumSensitiveDataMap,
) => {
  const root = String.raw`^root$`
  for (const item of numSensitiveData) {
    const tokens = item.pathTokens
    const tokensLength = tokens.length
    const sectionMap = numSensitiveDataMap[item.dataSection]
    for (let i = 0; i < tokensLength; i++) {
      const tmpPathTokens = tokens.slice(0, i + 1)
      const regex = getSensitiveDataRegex(
        tmpPathTokens,
        item.arrayFields,
        undefined,
        true,
      )
      const regexString = new RegExp(String.raw`^root\.${regex}$`).source
      if (!sectionMap.has(regexString)) {
        sectionMap.set(regexString, 1)
      } else {
        sectionMap.set(regexString, sectionMap.get(regexString) + 1)
      }
    }
    if (!sectionMap.has(root)) {
      sectionMap.set(root, 1)
    } else {
      sectionMap.set(root, sectionMap.get(root) + 1)
    }
  }
}

export const populateSensitiveData = async (
  trace: ApiTrace,
  dataFields: DataField[],
) => {
  const sensitiveDataMap = {
    [DataSection.REQUEST_PATH]: [],
    [DataSection.REQUEST_QUERY]: [],
    [DataSection.REQUEST_HEADER]: [],
    [DataSection.REQUEST_BODY]: [],
    [DataSection.RESPONSE_HEADER]: [],
    [DataSection.RESPONSE_BODY]: [],
  }
  const numSensitiveData: NumSensitiveData[] = []
  const numSensitiveDataMap = {
    [DataSection.REQUEST_PATH]: new Map<string, number>(),
    [DataSection.REQUEST_QUERY]: new Map<string, number>(),
    [DataSection.REQUEST_HEADER]: new Map<string, number>(),
    [DataSection.REQUEST_BODY]: new Map<string, number>(),
    [DataSection.RESPONSE_HEADER]: new Map<string, number>(),
    [DataSection.RESPONSE_BODY]: new Map<string, number>(),
  }

  if (!dataFields) {
    return { sensitiveDataMap, numSensitiveDataMap }
  }

  const { reqContentType, respContentType } = getContentTypes(trace)
  for (const dataField of dataFields) {
    const isRespBody = dataField.dataSection === DataSection.RESPONSE_BODY
    const isRespHeader = dataField.dataSection === DataSection.RESPONSE_HEADER
    const isReqBody = dataField.dataSection === DataSection.REQUEST_BODY
    const nonFilterSection = !isReqBody && !isRespHeader && !isRespHeader
    const isPairObjectSection =
      dataField.dataSection === DataSection.REQUEST_QUERY ||
      dataField.dataSection === DataSection.REQUEST_HEADER ||
      dataField.dataSection === DataSection.RESPONSE_HEADER
    if (
      (nonFilterSection ||
        (isRespBody &&
          dataField.contentType === respContentType &&
          dataField.statusCode === trace.responseStatus) ||
        (isReqBody && dataField.contentType === reqContentType) ||
        (isRespHeader && dataField.statusCode === trace.responseStatus)) &&
      dataField.dataClasses.length > 0
    ) {
      let prefix = `^root\.`
      let regex = ""
      let pathTokens = dataField.dataPath.split(".")
      if (isPairObjectSection) {
        const pairName = pathTokens[0]
        const traceData = getPairObjectData(dataField.dataSection, trace)
        let index = null
        for (let i = 0; i < traceData.length; i++) {
          if (traceData[i].name === pairName) {
            index = i
            break
          }
        }
        if (index !== null) {
          pathTokens = pathTokens.slice(1, pathTokens.length)
          const tmpSenDataPrefix = String.raw`${index}\.value`
          const tmpRegex = getSensitiveDataRegex(
            pathTokens,
            dataField.arrayFields,
            `${pairName}`,
          )
          regex = tmpSenDataPrefix + tmpRegex
          if (pathTokens.length > 0) {
            pathTokens = [`${index}`, "value", ...pathTokens]
          } else if (Object.keys(dataField.arrayFields).length > 0) {
            pathTokens = [`${index}`, "value"]
          } else {
            pathTokens = [`${index}`]
          }
        }
      } else {
        regex = getSensitiveDataRegex(pathTokens, dataField.arrayFields)
      }
      const regexString = new RegExp(String.raw`${prefix}${regex}$`).source

      sensitiveDataMap[dataField.dataSection].push([
        regexString,
        dataField.dataClasses,
      ])

      numSensitiveData.push({
        pathTokens,
        arrayFields: dataField.arrayFields,
        dataSection: dataField.dataSection,
      })
    }
  }
  getNumSensitiveData(numSensitiveData, numSensitiveDataMap)
  return Promise.resolve({ sensitiveDataMap, numSensitiveDataMap })
}
