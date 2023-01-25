import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"

export default {
  name: "CSP",
  version: 1,
  builder: (endpoint: GenTestEndpoint) => {
    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Has CSP Headers`,
        severity: "LOW",
        tags: ["CSP"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint).assert({
          type: AssertionType.enum.JS,
          value: "resp.headers['content-security-policy']",
        }),
      )
  },
}
