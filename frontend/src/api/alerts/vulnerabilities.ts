import { GetVulnerabilityAggParams, VulnerabilitySummary } from "@common/types"
import axios from "axios"
import { getAPIURL } from "~/constants"

export const getVulnerabilitySummary = async (
  params: GetVulnerabilityAggParams,
): Promise<VulnerabilitySummary> => {
  const resp = await axios.get<VulnerabilitySummary>(
    `${getAPIURL()}/vulnerability-summary`,
    { params },
  )
  return resp.data
}
