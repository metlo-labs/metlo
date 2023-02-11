import axios, { AxiosRequestHeaders } from "axios"
import {
  ApiEndpoint,
  ApiEndpointDetailed,
  HostResponse,
  HostGraph,
  Usage,
} from "@common/types"
import {
  GetEndpointParams,
  GetHostParams,
  UpdateFullTraceCaptureEnabledParams,
} from "@common/api/endpoint"
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

export const getHostsList = async (
  params: GetHostParams,
  headers?: AxiosRequestHeaders,
): Promise<[HostResponse[], number]> => {
  const resp = await axios.get<[HostResponse[], number]>(
    `${getAPIURL()}/hosts`,
    { params, headers },
  )
  return resp.data
}

export const getHostsGraph = async (
  params: GetHostParams,
  headers?: AxiosRequestHeaders,
): Promise<HostGraph> => {
  const resp = await axios.get<HostGraph>(`${getAPIURL()}/hosts-graph`, {
    params,
    headers,
  })
  return resp.data
}

export const deleteHosts = async (
  hosts: string[],
  headers?: AxiosRequestHeaders,
): Promise<any> => {
  const resp = await axios.delete(`${getAPIURL()}/hosts`, {
    data: { hosts },
    headers,
  })
  return resp.data
}

export const deleteEndpoint = async (
  endpointId: string,
  headers?: AxiosRequestHeaders,
): Promise<any> => {
  const resp = await axios.delete(`${getAPIURL()}/endpoint/${endpointId}`, {
    headers,
  })
  return resp.data
}

export const getSuggestedPaths = async (
  endpointId: string,
  headers?: AxiosRequestHeaders,
): Promise<string[]> => {
  const resp = await axios.get<string[]>(
    `${getAPIURL()}/endpoint/${endpointId}/suggested-paths`,
    { headers },
  )
  return resp.data
}

export const updatePaths = async (
  endpointId: string,
  paths: string[],
  headers?: AxiosRequestHeaders,
) => {
  const resp = await axios.post(
    `${getAPIURL()}/endpoint/${endpointId}/update-paths`,
    { paths, headers },
  )
  return resp.data
}

export const updateFullTraceCaptureEnabled = async (
  endpointId: string,
  params: UpdateFullTraceCaptureEnabledParams,
  headers?: AxiosRequestHeaders,
): Promise<void> => {
  await axios.put(
    `${getAPIURL()}/endpoint/${endpointId}/enable-full-trace-capture`,
    params,
    { headers },
  )
}
