import { KeyValType, TestRequest } from "../types/test"
import { AuthType, Method } from "../types/enums"
import { DataSection, DataType } from "./enums"

export interface GenTestEndpointDataField {
  dataSection: DataSection
  arrayFields: Record<string, number>
  contentType: string
  dataPath: string
  dataType: DataType
  traceHash: Record<string, number>
}

export interface GenTestEndpointAuthConfig {
  authType: AuthType
  headerKey: string
  jwtUserPath: string
  cookieName: string
}

export interface GenTestEndpoint {
  host: string
  path: string
  method: Method
  dataFields: GenTestEndpointDataField[]
  authConfig?: GenTestEndpointAuthConfig
}

export interface GenTestContext {
  endpoint: GenTestEndpoint
  prefix?: string
}

export interface GeneratedTestRequest {
  req: TestRequest
  env: KeyValType[]
}
