import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"

export default {
  name: "BOLA-MULTI-TENANT",
  version: 1,
  builder: (endpoint: GenTestEndpoint) => {
    if (!endpoint.authConfig) {
      throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
    }

    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} BOLA-MULTI-TENANT`,
        severity: "HIGH",
        tags: ["BOLA", "MULTI-TENANT"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, "TENANT_A").assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, "TENANT_A")
          .addAuth(endpoint, "TENANT_B")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [404],
          }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, "TENANT_B")
          .addAuth(endpoint, "TENANT_A")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [404],
          }),
      )
  },
}
