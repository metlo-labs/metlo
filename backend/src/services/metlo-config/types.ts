import { AuthenticationConfig } from "@common/types"

export interface HostMapping {
  host: string
  pattern: string
}

export interface HostMappingCompiled {
  host: string
  pattern: RegExp
}

export interface PathBlockList {
  host: string
  paths: string[]
}

export interface PathBlockListCompiled {
  host: RegExp
  paths: RegExp[]
}

export interface MetloConfigType {
  globalFullTraceCapture?: boolean
  minAnalyzeTraces?: number
  hostMap?: HostMapping[]
  authentication?: AuthenticationConfig[]
  customWords?: string[]
  hostBlockList?: string[]
  pathBlockList?: PathBlockList[]
}
