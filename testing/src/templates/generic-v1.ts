import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"

export default {
  name: "GENERIC",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) =>
    new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Test`,
        severity: "LOW",
        tags: ["GENERIC"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, config).assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      ),
}
