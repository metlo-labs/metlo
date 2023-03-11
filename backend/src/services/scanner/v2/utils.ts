import { DataSection } from "@common/enums"
import { getMapDataFields } from "services/data-field/utils"
import { getContentTypeStatusCode } from "services/data-field/v2/utils"

export const getSensitiveDataFieldDataFromProcessedData = (
  dataPath: string,
  requestContentType: string,
  responseContentType: string,
  statusCode: number,
  mapDataFields: string[],
) => {
  let tmpMapDataFields = [...mapDataFields]
  const splitPath = dataPath.split(".")
  const dataSection = splitPath.shift() as DataSection
  const info = getContentTypeStatusCode(
    dataSection,
    requestContentType,
    responseContentType,
    statusCode,
  )
  let currPath = ""
  for (const path of splitPath) {
    let response = {
      key: path,
      filteredMapDataFields: null,
    }
    if (path !== "[]") {
      response = getMapDataFields(
        info.statusCode,
        info.contentType,
        dataSection,
        currPath || null,
        path,
        tmpMapDataFields,
      )
    }
    if (currPath.length === 0) {
      currPath += response.key
    } else {
      currPath += `.${response.key}`
    }
    if (response.filteredMapDataFields) {
      tmpMapDataFields = response.filteredMapDataFields
    }
  }
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
