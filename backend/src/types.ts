import { RestMethod } from "./enums"

export interface Meta {
  incoming: boolean
  source: string
  sourcePort: string
  destination: string
  destinationPort: string
  environment: string
}

export interface Parameter {
  name: string
  value: string
}

export interface Header {
  name: string
  value: string
}

export interface Url {
  host: string
  path: string
  parameters: Parameter[]
}

export interface Request {
  url: Url
  headers: Header[]
  body: string
  method: RestMethod
}

export interface Response {
  status: number
  headers: Header[]
  body: string
}

export interface TraceParams {
  request: Request
  response: Response
  meta: Meta
}

export interface GetEndpointParams {
  environment?: string
  host?: string
  riskScore?: string
  offset?: number
  limit?: number
}
