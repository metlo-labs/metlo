import {
  AuthAPIKeyParams,
  AuthBasicAuthParams,
  AuthBearerParams,
  Request,
} from "@common/testing/types"
import {
  APIKeyAuthAddTo,
  AuthType,
  RequestBodyType,
} from "@common/testing/enums"
import { ApiEndpoint } from "@common/types"
import axios, { AxiosError, AxiosRequestConfig } from "axios"
import { RestMethod } from "@common/enums"

// Configure interceptors on a custom Axios instance that can be reused.
const axiosInstance = axios.create()
axiosInstance.interceptors.request.use(
  function (config) {
    config.metadata = { startTime: new Date() }
    return config
  },
  function (error) {
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  function (response) {
    response.config.metadata.endTime = new Date()
    response.duration =
      response.config.metadata.endTime - response.config.metadata.startTime
    response.config.metadata.length = response.headers["content-length"]
    return response
  },
  function (error: AxiosError) {
    if (!error.response.config) {
      error.response.config = { metadata: {} }
    }
    error.response.config.metadata.endTime = new Date()
    error.response.duration =
      error.response.config.metadata.endTime -
      error.request.config.metadata.startTime
    error.response.config.metadata.length = 0
    return Promise.reject(error)
  },
)

const compileAuthData = (r: Request, rc: AxiosRequestConfig) => {
  switch (r.authorization.type) {
    case AuthType.API_KEY:
      let params_api = r.authorization.params as AuthAPIKeyParams
      if (params_api.add_to === APIKeyAuthAddTo.HEADERS) {
        rc.headers[params_api.key] = params_api.value
      } else {
        rc.params[params_api.key] = params_api.value
      }
      break
    case AuthType.NO_AUTH:
      // Do Nothing
      break
    case AuthType.BASIC_AUTH:
      let params_basic = r.authorization.params as AuthBasicAuthParams
      rc.headers["Authorization"] = `Basic ${Buffer.from(
        `${params_basic.username}:${params_basic.password}`,
        "binary",
      ).toString("base64")}`
      break
    case AuthType.BEARER:
      let params_bearer = r.authorization.params as AuthBearerParams
      console.log(params_bearer.bearer_token)
      rc.headers["Authorization"] = `Bearer ${params_bearer.bearer_token}`
      break
  }
}

export const sendRequest = (r: Request) => {
  console.log(r)
  let requestConfig: AxiosRequestConfig = {}
  requestConfig.url = r.url
  requestConfig.method = r.method
  requestConfig.params = Object.fromEntries(r.params.map(e => [e.key, e.value]))
  requestConfig.headers = Object.fromEntries(
    r.headers.map(e => [e.key, e.value]),
  )
  requestConfig.data = r.body.data

  compileAuthData(r, requestConfig)

  return axiosInstance.request(requestConfig)
}

export const makeNewRequest = (parsedEndpoint: ApiEndpoint) => ({
  method: parsedEndpoint.method,
  url: `http://${parsedEndpoint.host}${parsedEndpoint.path}`,
  params: [],
  headers: [],
  body: {
    type: RequestBodyType.NONE,
    data: null,
  },
  tests: "",
})

export const makeNewEmptyRequest = (parsedEndpoint: ApiEndpoint) => ({
  method: RestMethod.GET,
  url: `http://${parsedEndpoint.host}`,
  params: [],
  headers: [],
  body: {
    type: RequestBodyType.NONE,
    data: null,
  },
  tests: "",
})
