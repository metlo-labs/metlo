import { DisableRestMethod } from "@common/enums"
import { AuthenticationConfig } from "@common/types"

export interface HostMapping {
  host: string
  pattern: string
}

export interface HostMappingCompiled {
  host: string
  pattern: RegExp
}

export interface DisablePaths {
  disable_paths: string[]
}

export type BlockFieldConfig = Record<
  string,
  DisablePaths | Record<DisableRestMethod, DisablePaths>
>

export interface MetloConfigType {
  globalFullTraceCapture?: boolean
  minAnalyzeTraces?: number
  hostMap?: HostMapping[]
  authentication?: AuthenticationConfig[]
  customWords?: string[]
  blockFields?: Record<string, BlockFieldConfig>
}
