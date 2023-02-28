import { GenTestEndpoint } from "../generate/types"
import { TestBuilder } from "../generate/builder"
import { TemplateConfig } from "../types/resource_config"
import {
  authTestStepPayloadToBuilder,
  getAuthTestPayloads,
} from "../generate/auth-test-step-gen"

export default {
  name: "VALIDATE_AUTH_RULES",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    const testStepPayloads = getAuthTestPayloads(endpoint, config)
    const hostInfo = config.hosts[endpoint.host]
    let builder = new TestBuilder().setMeta({
      name: `${endpoint.path} VALIDATE_AUTH_RULES`,
      severity: "HIGH",
      tags: ["BOLA", "BFLA", "IDOR"],
    })
    for (let i = 0; i < testStepPayloads.length; i++) {
      builder = builder.addTestStep(
        authTestStepPayloadToBuilder(
          endpoint,
          testStepPayloads[i],
          i + 1,
          hostInfo,
        ),
      )
    }
    return builder
  },
}
