import { ApiTrace } from "models"
import { DataType, RestMethod } from "@common/enums"

export interface GenerateEndpoint {
  parameterizedPath: string
  host: string
  regex: string
  method: RestMethod
  traces: ApiTrace[]
}

export interface BodySchema {
  nullable?: boolean
  type?: DataType
  items?: BodySchema
  properties?: Record<string, BodySchema>
}

export interface BodyContent {
  [key: string]: { schema?: BodySchema }
}

export interface Responses {
  [key: string]: {
    description: string
    headers?: BodyContent
    content?: BodyContent
  }
}

export enum JobName {
  GENERATE_OPENAPI_SPEC = "generate_openapi_spec",
  CHECK_UNAUTH_ENDPOINTS = "check_unauth_endpoints",
  MONITOR_ENDPOINT_HSTS = "monitor_endpoint_hsts",
  CLEAR_API_TRACES = "clear_api_traces",
  UPDATE_ENDPOINT_IPS = "update_endpoint_ips",
  LOG_AGGREGATED_STATS = "log_aggregated_stats",
  FIX_ENDPOINTS = "fix_endpoints",
}
