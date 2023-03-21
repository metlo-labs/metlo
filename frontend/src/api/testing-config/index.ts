import axios, { AxiosRequestHeaders } from "axios"
import { TestingConfigResp } from "@common/types"
import { getAPIURL } from "~/constants"

export const getTestingConfig = async (
  headers?: AxiosRequestHeaders,
): Promise<TestingConfigResp> => {
  const resp = await axios.get<TestingConfigResp>(
    `${getAPIURL()}/testing-config`,
    {
      headers,
    },
  )
  return resp.data
}

export const updateTestingConfig = async (
  configString: string,
  headers?: AxiosRequestHeaders,
): Promise<number> => {
  const resp = await axios.put(
    `${getAPIURL()}/testing-config`,
    { configString },
    { headers },
  )
  return resp.status
}

export const getEntityTags = async (
  headers?: AxiosRequestHeaders,
): Promise<string[]> => {
  const resp = await axios.get<string[]>(
    `${getAPIURL()}/testing-config/entity-tags`,
    { headers },
  )
  return resp.data
}

export const getResourcePerms = async (
  headers?: AxiosRequestHeaders,
): Promise<string[]> => {
  const resp = await axios.get<string[]>(
    `${getAPIURL()}/testing-config/resource-permissions`,
    { headers },
  )
  return resp.data
}
