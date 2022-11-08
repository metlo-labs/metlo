import axios, { AxiosRequestHeaders } from "axios"
import { getAPIURL } from "~/constants"
import { Test, Result } from "@metlo/testing"
import { TestDetailed } from "@common/types"

export const runTest = async (
  test: Test,
  endpointUuid: string,
  headers?: AxiosRequestHeaders,
) => {
  const resp = await axios.post<Result[]>(
    `${getAPIURL()}/test/run`,
    {
      test,
      endpointUuid,
    },
    { headers },
  )
  return resp.data
}

export const listTests = async (headers?: AxiosRequestHeaders) => {
  const resp = await axios.get<Array<TestDetailed>>(
    `${getAPIURL()}/test/list`,
    { headers },
  )
  return resp
}

export const getTest = async (
  testUUID: string,
  headers?: AxiosRequestHeaders,
) => {
  const resp = await axios.get<TestDetailed>(
    `${getAPIURL()}/test/list/${testUUID}`,
    { headers },
  )
  return resp
}

export const deleteTest = async (
  testUUID: string,
  headers?: AxiosRequestHeaders,
) => {
  const resp = await axios.delete(`${getAPIURL()}/test/${testUUID}/delete`, {
    headers,
  })
  return resp
}

export const saveTest = async (
  test: Test,
  endpoint_uuid: string,
  headers?: AxiosRequestHeaders,
) => {
  const resp = await axios.post<Test>(
    `${getAPIURL()}/test/save`,
    {
      test,
      endpointUuid: endpoint_uuid,
    },
    { headers },
  )
  return resp.data
}
