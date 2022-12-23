import { TestBuilder } from "generate/builder"
import { GenTestEndpoint } from "generate/types"

export interface TestTemplate {
  name: string
  version: number
  builder: (endpoint: GenTestEndpoint) => TestBuilder
}
