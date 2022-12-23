import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"

export default {
  name: "GENERIC",
  version: 1,
  builder: (endpoint: GenTestEndpoint) =>
    new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Test`,
        severity: "LOW",
        tags: ["GENERIC"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint).assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      ),
}
