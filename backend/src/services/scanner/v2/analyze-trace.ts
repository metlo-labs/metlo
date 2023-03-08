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
  mapDataFields: string[],
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
    mapDataFields,
  )
  for (const dataPath in sensitiveDataDetected) {
    const info = getSensitiveDataFieldDataFromProcessedData(
      dataPath,
      reqContentType,
      resContentType,
      statusCode ?? -1,
      mapDataFields,
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
