import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { getEntityMap } from "../generate/permissions"
import { TemplateConfig } from "../types/resource_config"

export default {
  name: "BOLA",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    if (!endpoint.authConfig) {
      throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
    }
    const entityMap = getEntityMap(endpoint, config)

    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} BOLA`,
        severity: "HIGH",
        tags: ["BOLA"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, config, "USER_A").assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, config, "USER_A")
          .addAuth(endpoint, "USER_B")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [401, 403],
          }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, config, "USER_B")
          .addAuth(endpoint, "USER_A")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [401, 403],
          }),
      )
  },
}
