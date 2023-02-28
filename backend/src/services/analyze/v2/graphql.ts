import { GraphQlData } from "@common/types"
import { ApiEndpoint } from "models"

const getUniqueSensitiveData = (
  currSensitiveData: string[],
  newSensitiveData: string[],
): string[] => {
  for (const item of newSensitiveData) {
    if (!currSensitiveData.includes(item)) {
      currSensitiveData.push(item)
    }
  }
  return currSensitiveData
}

export const processGraphQlData = (
  graphQlData: GraphQlData,
  apiEndpoint: ApiEndpoint,
) => {
  if (!graphQlData) {
    return
  }
  const currSensitiveData: Record<string, string[]> =
    apiEndpoint.graphQlMetadata?.sensitiveDataDetected ?? {}
  for (const operation of graphQlData.operations) {
    for (const path in operation.sensitiveDataDetected) {
      if (currSensitiveData[path]) {
        currSensitiveData[path] = getUniqueSensitiveData(
          currSensitiveData[path],
          operation.sensitiveDataDetected[path],
        )
      } else {
        currSensitiveData[path] = operation.sensitiveDataDetected[path]
      }
    }
  }
  apiEndpoint.graphQlMetadata.sensitiveDataDetected = currSensitiveData
}
