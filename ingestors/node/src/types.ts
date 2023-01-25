export interface ConfigOptions {
  apiHost?: string
}

export interface MetloConfig {
  host: string
  key: string
  opts?: ConfigOptions
}

export interface PostTraceTask {
  host: string
  key: string
  data: any
}
