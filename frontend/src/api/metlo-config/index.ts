import { MetloConfigResp } from "@common/types"
import axios, { AxiosRequestHeaders } from "axios"
import { getAPIURL } from "~/constants"

export const updateMetloConfig = async (
  configString: string,
  headers?: AxiosRequestHeaders,
): Promise<number> => {
  const resp = await axios.put(
    `${getAPIURL()}/metlo-config`,
    { configString },
    { headers },
  )
  return resp.status
}

export const getMetloConfig = async (
  headers?: AxiosRequestHeaders,
): Promise<MetloConfigResp> => {
  const resp = await axios.get<MetloConfigResp>(`${getAPIURL()}/metlo-config`, {
    headers,
  })
  return resp.data
}
