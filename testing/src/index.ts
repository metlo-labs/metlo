import axios, { AxiosRequestConfig } from "axios"
import FormData from "form-data"
import expect from "expect"
import { VM } from "vm2"
import {
  Test,
  Result,
  Request,
  TestResult,
  AuthAPIKeyParams,
  RequestBodyDataTypeFormData,
  AuthBearerParams,
  AuthBasicAuthParams,
} from "./types"
import MetloTester from "./Tester"
import { APIKeyAuthAddTo, AuthType, RequestBodyType } from "./enums"
import { processTemplate } from "./utils"

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

const makeAxiosRequestConfig = (
  request: Request,
  envVars: Map<string, string>,
): AxiosRequestConfig => {
  let requestConfig = {
    url: processTemplate(request.url, envVars),
    method: request.method,
    headers: Object.fromEntries(request.headers.map(e => [e.key, e.value])),
    params: {},
    transformResponse: res => res,
    validateStatus: code => true,
  } as AxiosRequestConfig

  // Query Params
  if (request.params.length > 0) {
    requestConfig.params = Object.fromEntries(
      request.params.map(e => [e.key, e.value]),
    )
  }

  // Body
  if (request.body.type == RequestBodyType.JSON) {
    requestConfig.data = request.body.data
    requestConfig.headers["Content-Type"] =
      requestConfig.headers["Content-Type"] || "application/json"
  } else if (request.body.type == RequestBodyType.FORM_DATA) {
    let bodyFormData = new FormData()
    const requestData = request.body.data as RequestBodyDataTypeFormData
    requestData.forEach(e => bodyFormData.append(e.key, e.value))
    requestConfig.data = bodyFormData
    requestConfig.headers["Content-Type"] =
      requestConfig.headers["Content-Type"] || "multipart/form-data"
  }

  // Authorization
  if (request.authorization) {
    const auth = request.authorization
    if (auth.type == AuthType.API_KEY) {
      const params = auth.params as AuthAPIKeyParams
      if (params.add_to == APIKeyAuthAddTo.HEADERS) {
        requestConfig.headers[params.key] = params.value
      } else if (params.add_to == APIKeyAuthAddTo.QUERY_PARAMS) {
        requestConfig.params[params.key] = params.value
      }
    } else if (auth.type == AuthType.BEARER) {
      const params = auth.params as AuthBearerParams
      requestConfig.headers["Authorization"] =
        requestConfig.headers["Authorization"] ||
        `Bearer ${params.bearer_token}`
    } else if (auth.type == AuthType.BASIC_AUTH) {
      const params = auth.params as AuthBasicAuthParams
      requestConfig.auth = {
        username: params.username,
        password: params.password,
      }
    }
  }

  return requestConfig
}

export const runRequest = async (
  request: Request,
  envVars: Map<string, string>,
): Promise<Result> => {
  let requestConfig = makeAxiosRequestConfig(request, envVars)
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

export const runTest = async (
  test: Test,
  envVars?: Map<string, string>,
): Promise<Result[]> => {
  let output: Result[] = []
  envVars = envVars || new Map<string, string>()
  for (let i = 0; i < test.requests.length; i++) {
    const res = await runRequest(test.requests[i], envVars)
    output.push(res)
  }
  return output
}
