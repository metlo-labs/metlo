import { TestBuilder } from "generate/builder"
import { GenTestEndpoint } from "generate/types"
import { TemplateConfig } from "types/resource_config"

export interface TestTemplate {
  name: string
  version: number
  builder:
    | ((endpoint: GenTestEndpoint) => TestBuilder)
    | ((endpoint: GenTestEndpoint, config: TemplateConfig) => TestBuilder)
}
