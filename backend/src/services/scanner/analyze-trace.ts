import { DataSection } from "@common/enums"
import { DataClass } from "@common/types"
import { ApiTrace } from "models"
import { getContentTypes } from "services/data-field/utils"
import {
  findBodySensitiveData,
  findPairObjectSensitiveData,
  findPathSensitiveData,
} from "./utils"

type DataFieldKey = string

export const getSensitiveDataMap = (
  dataClasses: DataClass[],
  apiTrace: ApiTrace,
  apiEndpointPath: string,
): Record<DataFieldKey, string[]> => {
  const statusCode = apiTrace.responseStatus
  const { reqContentType, resContentType } = getContentTypes(
    apiTrace.requestHeaders,
    apiTrace.responseHeaders,
  )
  const sensitiveDataMap: Record<DataFieldKey, string[]> = {}
  findPathSensitiveData(
    dataClasses,
    apiTrace.path,
    apiEndpointPath,
    sensitiveDataMap,
  )
  if (statusCode < 400) {
    findPairObjectSensitiveData(
      dataClasses,
      DataSection.REQUEST_QUERY,
      apiTrace.requestParameters,
      "",
      -1,
      sensitiveDataMap,
    )
    findPairObjectSensitiveData(
      dataClasses,
      DataSection.REQUEST_HEADER,
      apiTrace.requestHeaders,
      "",
      -1,
      sensitiveDataMap,
    )
    findBodySensitiveData(
      dataClasses,
      DataSection.REQUEST_BODY,
      apiTrace.requestBody,
      reqContentType,
      -1,
      sensitiveDataMap,
    )
  }
  findPairObjectSensitiveData(
    dataClasses,
    DataSection.RESPONSE_HEADER,
    apiTrace.responseHeaders,
    "",
    statusCode,
    sensitiveDataMap,
  )
  findBodySensitiveData(
    dataClasses,
    DataSection.RESPONSE_BODY,
    apiTrace.responseBody,
    resContentType,
    statusCode,
    sensitiveDataMap,
  )
  return sensitiveDataMap
}
