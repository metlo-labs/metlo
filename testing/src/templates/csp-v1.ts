import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"
import { getEntityMap } from "../generate/permissions"

export default {
  name: "CSP",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    const entityMap = getEntityMap(endpoint, config)
    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Has CSP Headers`,
        severity: "LOW",
        tags: ["CSP"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, undefined, entityMap).assert({
          type: AssertionType.enum.JS,
          value: "resp.headers['content-security-policy']",
        }),
      )
  },
}
