import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"
import { getEntityMap } from "../generate/permissions"

export default {
  name: "BOLA_ADMIN",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    if (!endpoint.authConfig) {
      throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
    }
    const entityMap = getEntityMap(endpoint, config)

    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} BOLA_ADMIN`,
        severity: "HIGH",
        tags: ["BOLA", "ADMIN"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, "ADMIN_USER", entityMap).assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, "ADMIN_USER", entityMap)
          .addAuth(endpoint, "NON_ADMIN_USER")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [401, 403, 404],
          }),
      )
  },
}
