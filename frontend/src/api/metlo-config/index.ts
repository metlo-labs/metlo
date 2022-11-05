import { MetloConfigResp } from "@common/types"
import axios from "axios"
import { getAPIURL } from "~/constants"

export const updateMetloConfig = async (
  configString: string,
): Promise<number> => {
  const resp = await axios.put(`${getAPIURL()}/metlo-config`, { configString })
  return resp.status
}

export const getMetloConfig = async (): Promise<MetloConfigResp> => {
  const resp = await axios.get<MetloConfigResp>(`${getAPIURL()}/metlo-config`)
  return resp.data
}
