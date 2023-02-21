import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"
import { getAuthTestPayloads } from "../generate/auth-test-step-gen"

export default {
  name: "VALIDATE_AUTH_RULES",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    const testStepPayloads = getAuthTestPayloads(endpoint, config)
    console.log(JSON.stringify(testStepPayloads, null, 4))
    const builder = new TestBuilder().setMeta({
      name: `${endpoint.path} VALIDATE_AUTH_RULES`,
      severity: "HIGH",
      tags: ["BOLA", "BFLA", "IDOR"],
    })
    return builder
  },
}
