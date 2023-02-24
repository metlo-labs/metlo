import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"

export default {
  name: "BOLA_MULTI_TENANT",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    if (!endpoint.authConfig) {
      throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
    }

    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} BOLA_MULTI_TENANT`,
        severity: "HIGH",
        tags: ["BOLA", "MULTI-TENANT"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, config, "TENANT_A").assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, config, "TENANT_A")
          .addAuth(endpoint, "TENANT_B")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [404],
          }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, config, "TENANT_B")
          .addAuth(endpoint, "TENANT_A")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [404],
          }),
      )
  },
}
