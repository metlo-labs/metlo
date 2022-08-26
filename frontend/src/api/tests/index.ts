import axios from "axios"
import { getAPIURL } from "~/constants"
import { TestDetailed, Test, Result } from "@common/testing/types"

export const runTest = async (test: Test) => {
  const resp = await axios.post<Result[]>(`${getAPIURL()}/test/run`, {
    test,
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

export const saveTest = async (test: Test, endpoint_uuid: string) => {
  const resp = await axios.post<any>(`${getAPIURL()}/test/save`, {
    test,
    endpointUuid: endpoint_uuid,
  })
}
