import { APIKeyAuthAddTo, AuthType, RequestBodyType, RestMethod } from "./enums"

export interface AuthAPIKeyParams {
  key: string
  value: string
  add_to: APIKeyAuthAddTo
}

export interface AuthBasicAuthParams {
  username: string
  password: string
}

export interface AuthBearerParams {
  bearer_token: string
}

export interface AuthAPINoAuth {}

export interface Authorization {
  type: AuthType
  params:
    | AuthAPINoAuth
    | AuthAPIKeyParams
    | AuthBasicAuthParams
    | AuthBearerParams
}

export interface DataPair {
  key: string
  value: string
  description?: string
}

export type QueryParam = DataPair
export type Header = DataPair

export type RequestBodyDataTypeNone = null
export type RequestBodyDataTypeJSON = string
export type RequestBodyDataTypeFormData = DataPair[]

export interface RequestBody {
  type: RequestBodyType
  data: RequestBodyDataTypeNone | RequestBodyDataTypeFormData | string
}

export interface TestResult {
  name: string
  success: boolean
  output: string
}

export interface Result {
  body: string
  headers: Header[]
  testResults: TestResult[]
  code: number
  statusText: string
  duration: number
  error?: string
}

export interface Request {
  name?: string
  method: RestMethod
  url: string
  authorization?: Authorization
  params: QueryParam[]
  headers: Header[]
  body: RequestBody
  tests: string
  result?: Result
}

export interface Test {
  uuid: string
  name: string
  tags: string[]
  requests: Request[]
}
