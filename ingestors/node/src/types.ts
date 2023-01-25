export interface MetloOptions {
  apiHost?: string
}

export interface MetloConfig {
  host: string
  key: string
  opts?: MetloOptions
}

export interface PostTraceTask {
  host: string
  key: string
  data: any
}
