import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"

export default {
  name: "BROKEN_AUTHENTICATION",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    if (!endpoint.authConfig) {
      throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
    }

    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Broken Authentication`,
        severity: "HIGH",
        tags: ["BROKEN_AUTHENTICATION"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, config).assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, config).assert({
          type: AssertionType.enum.EQ,
          key: "resp.status",
          value: [401, 403],
        }),
      )
  },
}
