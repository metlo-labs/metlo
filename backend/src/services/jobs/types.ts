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
  LOG_AGGREGATED_STATS = "log_aggregated_stats",
  FIX_ENDPOINTS = "fix_endpoints",
  DETECT_SENSITIVE_DATA = "detect_sensitive_data",
  DETECT_PRIVATE_HOSTS = "detect_private_host",
  UPDATE_HOURLY_TRACE_AGG = "update_hourly_trace_aggregate",
}
