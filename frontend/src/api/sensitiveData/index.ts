import axios from "axios"
import { GetSensitiveDataAggParams, SensitiveDataSummary } from "@common/types"
import { getAPIURL } from "~/constants"

export const getSensitiveDataSummary = async (
  params: GetSensitiveDataAggParams,
): Promise<SensitiveDataSummary> => {
  const resp = await axios.get<SensitiveDataSummary>(
    `${getAPIURL()}/sensitive-data-summary`,
    { params },
  )
  return resp.data
}
