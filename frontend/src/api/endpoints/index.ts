import axios, { AxiosRequestHeaders } from "axios"
import {
  ApiEndpoint,
  ApiEndpointDetailed,
  GetEndpointParams,
  Usage,
} from "@common/types"
import { getAPIURL } from "~/constants"

export const getEndpoints = async (
  params: GetEndpointParams,
  headers?: AxiosRequestHeaders,
): Promise<[ApiEndpoint[], number]> => {
  try {
    const resp = await axios.get<[ApiEndpoint[], number]>(
      `${getAPIURL()}/endpoints`,
      { params, headers },
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return [[], 0]
  } catch (err) {
    console.error(`Error fetching endpoints: ${err}`)
    return [[], 0]
  }
}

export const getEndpoint = async (
  endpointId: string,
  headers?: AxiosRequestHeaders,
): Promise<ApiEndpointDetailed> => {
  try {
    const resp = await axios.get<ApiEndpointDetailed>(
      `${getAPIURL()}/endpoint/${endpointId}`,
      { headers },
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return null
  } catch (err) {
    console.error(`Error fetching endpoint: ${err}`)
    return null
  }
}

export const getHosts = async (
  headers?: AxiosRequestHeaders,
): Promise<string[]> => {
  try {
    const resp = await axios.get<string[]>(
      `${getAPIURL()}/endpoints/hosts`,

      { headers },
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return []
  } catch (err) {
    console.error(`Error fetching hosts: ${err}`)
    return []
  }
}

export const getUsage = async (
  endpointId: string,
  headers?: AxiosRequestHeaders,
): Promise<Usage[]> => {
  try {
    const resp = await axios.get<Usage[]>(
      `${getAPIURL()}/endpoint/${endpointId}/usage`,
      { headers },
    )
    if (resp.status === 200 && resp.data) {
      return resp.data
    }
    return []
  } catch (err) {
    console.error(`Error fetching endpoint usage: ${err}`)
    return []
  }
}

export const updateEndpointAuthenticated = async (
  endpointId: string,
  authenticated: boolean,
  headers?: AxiosRequestHeaders,
): Promise<void> => {
  await axios.put(
    `${getAPIURL()}/endpoint/${endpointId}/authenticated`,
    {
      authenticated,
    },
    { headers },
  )
}
