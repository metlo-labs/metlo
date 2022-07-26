export interface Meta {
  incoming: boolean
  source: string
  sourcePort: string
  destination: string
  destinationPort: string
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
  baseUrl: string
  parameters: Parameter[]
}

export interface Request {
  url: Url
  headers: Header[]
  body: string
}

export interface Response {
  status: number
  url: Url
  headers: Header[]
  body: string
}

export interface TraceParams {
  request: Request
  response: Response
  meta: Meta
}
