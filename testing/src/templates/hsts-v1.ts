import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"

export default {
  name: "HSTS",
  version: 1,
  builder: (endpoint: GenTestEndpoint) => {
    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Has HSTS Headers`,
        severity: "MEDIUM",
        tags: ["HSTS"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint).assert({
          type: AssertionType.enum.JS,
          value: "resp.headers['strict-transport-security']",
        }),
      )
  },
}
