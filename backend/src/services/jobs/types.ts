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
