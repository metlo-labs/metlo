import axios, { AxiosRequestHeaders } from "axios"
import { ApiTrace } from "@common/types"
import { GetTracesParams } from "@common/api/trace"
import { getAPIURL } from "~/constants"

export const getTraces = async (
  params: GetTracesParams,
  headers?: AxiosRequestHeaders,
): Promise<ApiTrace[]> => {
  try {
    const resp = await axios.get<ApiTrace[]>(
      `${getAPIURL()}/traces`,
      { params, headers },
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return []
  } catch (err) {
    console.error(`Error fetching traces: ${err}`)
    return []
  }
}
