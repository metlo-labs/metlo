import { GetVulnerabilityAggParams, VulnerabilitySummary } from "@common/types"
import axios, { AxiosRequestHeaders } from "axios"
import { getAPIURL } from "~/constants"

export const getVulnerabilitySummary = async (
  params: GetVulnerabilityAggParams,
  headers?: AxiosRequestHeaders,
): Promise<VulnerabilitySummary> => {
  const resp = await axios.get<VulnerabilitySummary>(
    `${getAPIURL()}/vulnerability-summary`,
    { params, headers },
  )
  return resp.data
}
