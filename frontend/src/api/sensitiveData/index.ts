import axios, { AxiosRequestHeaders } from "axios"
import { GetSensitiveDataAggParams, SensitiveDataSummary } from "@common/types"
import { getAPIURL } from "~/constants"

export const getSensitiveDataSummary = async (
  params: GetSensitiveDataAggParams,
  headers?: AxiosRequestHeaders,
): Promise<SensitiveDataSummary> => {
  const resp = await axios.get<SensitiveDataSummary>(
    `${getAPIURL()}/sensitive-data-summary`,
    { params, headers },
  )
  return resp.data
}
