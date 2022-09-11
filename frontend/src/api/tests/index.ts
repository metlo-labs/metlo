import axios from "axios"
import { getAPIURL } from "~/constants"
import { Test, Result } from "@metlo/testing"
import { TestDetailed } from "@common/types"

export const runTest = async (test: Test, endpointUuid: string) => {
  const resp = await axios.post<Result[]>(`${getAPIURL()}/test/run`, {
    test,
    endpointUuid,
  })
  return resp.data
}

export const listTests = async () => {
  const resp = await axios.get<Array<TestDetailed>>(`${getAPIURL()}/test/list`)
  return resp
}

export const getTest = async (testUUID: string) => {
  const resp = await axios.get<TestDetailed>(
    `${getAPIURL()}/test/list/${testUUID}`,
  )
  return resp
}

export const deleteTest = async (testUUID: string) => {
  const resp = await axios.delete(`${getAPIURL()}/test/${testUUID}/delete`)
  return resp
}

export const saveTest = async (test: Test, endpoint_uuid: string) => {
  const resp = await axios.post<Test>(`${getAPIURL()}/test/save`, {
    test,
    endpointUuid: endpoint_uuid,
  })
  return resp.data
}
