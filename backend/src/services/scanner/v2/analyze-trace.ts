import { DataClass, ProcessedTraceData, QueuedApiTrace } from "@common/types"
import { findPathSensitiveData } from "services/scanner/utils"
import {
  addDataFieldToSensitiveDataMap,
  getSensitiveDataFieldDataFromProcessedData,
} from "./utils"

type DataFieldKey = string

export const getSensitiveDataMap = (
  dataClasses: DataClass[],
  apiTrace: QueuedApiTrace,
  apiEndpointPath: string,
  processedTraceData: ProcessedTraceData,
): Record<DataFieldKey, string[]> => {
  const statusCode = apiTrace.responseStatus
  const sensitiveDataDetected = processedTraceData?.sensitiveDataDetected ?? {}
  const reqContentType = processedTraceData?.requestContentType ?? ""
  const resContentType = processedTraceData?.responseContentType ?? ""

  const sensitiveDataMap: Record<DataFieldKey, string[]> = {}
  findPathSensitiveData(
    dataClasses,
    apiTrace.path,
    apiEndpointPath,
    sensitiveDataMap,
  )
  for (const dataPath in sensitiveDataDetected) {
    const info = getSensitiveDataFieldDataFromProcessedData(
      dataPath,
      reqContentType,
      resContentType,
      statusCode ?? -1,
    )
    addDataFieldToSensitiveDataMap(
      info.dataPath,
      info.dataSection,
      info.contentType,
      info.statusCode,
      sensitiveDataDetected[dataPath],
      sensitiveDataMap,
    )
  }
  return sensitiveDataMap
}

export const getSensitiveDataMapGraphQl = (
  processedTraceData: ProcessedTraceData,
): Record<string, string[]> => {
  const sensitiveDataDetected = processedTraceData?.sensitiveDataDetected ?? {}
  const graphqlOperations = processedTraceData?.graphQlData?.operations ?? []

  const sensitiveDataMap: Record<string, string[]> = {}

  for (const operation of graphqlOperations) {
    for (const key in operation.sensitiveDataDetected) {
      const operationTypeKey = `${operation.operationType}${
        operation.operationName ? `-${operation.operationName}` : ""
      }.${key}`
      const operationSensitiveData = operation.sensitiveDataDetected[key]
      const entries = sensitiveDataMap[operationTypeKey] ?? []
      operationSensitiveData.forEach(e => {
        if (!entries.includes(e)) {
          entries.push(e)
        }
      })
      sensitiveDataMap[operationTypeKey] = entries
    }
  }

  for (const key in sensitiveDataDetected) {
    if (!key.startsWith("resBody.data")) {
      continue
    }
    const sensitiveDataList = sensitiveDataDetected[key]
    const entries = sensitiveDataMap[key] ?? []
    sensitiveDataList.forEach(e => {
      if (!entries.includes(e)) {
        entries.push(e)
      }
    })
    sensitiveDataMap[key] = entries
  }
  return sensitiveDataMap
}
