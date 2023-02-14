import { DataSection } from "@common/enums"
import { getContentTypeStatusCode } from "services/data-field/v2/utils"

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
