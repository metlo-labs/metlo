import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"
import { getEntityMap } from "../generate/permissions"

export default {
  name: "HSTS",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    const entityMap = getEntityMap(endpoint, config)
    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Has HSTS Headers`,
        severity: "MEDIUM",
        tags: ["HSTS"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, undefined, entityMap).assert({
          type: AssertionType.enum.JS,
          value: "resp.headers['strict-transport-security']",
        }),
      )
  },
}
