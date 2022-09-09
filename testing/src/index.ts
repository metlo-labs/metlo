import axios, { AxiosRequestConfig } from "axios"
import expect from "expect"
import { VM } from "vm2"
import { Test, Result, Request, TestResult } from "./types"
import MetloTester from "./Tester"
import { RequestBodyType } from "./enums"

export {
  Test,
  Result,
  Request,
  TestResult,
  AuthAPIKeyParams,
  AuthBearerParams,
  Authorization,
  RequestBody,
  AuthBasicAuthParams,
  DataPair,
} from "./types"
export { APIKeyAuthAddTo, AuthType, RequestBodyType } from "./enums"

export const runRequest = async (request: Request): Promise<Result> => {
  let requestConfig = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.map(e => [e.key, e.value])),
    transformResponse: res => res,
    validateStatus: code => true,
  } as AxiosRequestConfig
  if (request.body.type == RequestBodyType.JSON) {
    requestConfig.data = request.body.data
    requestConfig.headers["Content-Type"] =
      requestConfig.headers["Content-Type"] || "application/json"
  }
  try {
    const start = Date.now()
    const response = await axios(requestConfig)
    const end = Date.now()
    let testResults: TestResult[] = []
    if (request.tests) {
      const m = new MetloTester(requestConfig, response)
      const vm = new VM({
        timeout: 100000,
        sandbox: {
          m,
          expect,
        },
      })
      testResults = vm.run(`${request.tests}\nm.run()`) as TestResult[]
    }
    return {
      body: response.data,
      headers: Object.entries(response.headers).map(([key, value]) => ({
        key,
        value: value as string,
      })),
      testResults,
      code: response.status,
      statusText: response.statusText,
      duration: end - start,
    }
  } catch (e) {
    return {
      body: "",
      headers: [],
      testResults: [],
      code: 0,
      statusText: "",
      duration: 0,
      error: e.message,
    }
  }
}

export const runTest = async (test: Test): Promise<Result[]> => {
  let output: Result[] = []
  for (let i = 0; i < test.requests.length; i++) {
    const res = await runRequest(test.requests[i])
    output.push(res)
  }
  return output
}
