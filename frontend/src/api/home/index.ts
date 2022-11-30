import axios, { AxiosRequestHeaders } from "axios"
import { Summary, InstanceSettings } from "@common/types"
import { getAPIURL } from "~/constants"

export const getSummary = async (
  headers?: AxiosRequestHeaders,
): Promise<Summary> => {
  try {
    const resp = await axios.get<Summary>(`${getAPIURL()}/summary`, { headers })
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return null
  } catch (err) {
    console.error(`Error fetching summary stats: ${err}`)
    return null
  }
}

export const getInstanceSettings = async (
  headers?: AxiosRequestHeaders,
): Promise<InstanceSettings> => {
  try {
    const resp = await axios.get<InstanceSettings>(
      `${getAPIURL()}/instance-settings`,
      { headers },
    )
    return resp.data
  } catch (err) {
    console.error(`Error fetching instance settings: ${err}`)
    return null
  }
}

export const getEndpointTracked = async (
  headers?: AxiosRequestHeaders,
): Promise<{ exists: boolean }> => {
  try {
    const resp = await axios.get<{ exists: boolean }>(
      `${getAPIURL()}/summary/endpoint-tracked`,
      { headers },
    )
    return resp.data
  } catch (err) {
    return { exists: false }
  }
}
