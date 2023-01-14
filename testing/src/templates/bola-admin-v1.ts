import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"

export default {
  name: "BOLA_ADMIN",
  version: 1,
  builder: (endpoint: GenTestEndpoint) => {
    if (!endpoint.authConfig) {
      throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
    }

    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} BOLA_ADMIN`,
        severity: "HIGH",
        tags: ["BOLA", "ADMIN"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, "ADMIN_USER").assert({
          type: AssertionType.enum.JS,
          value: "resp.status < 300",
        }),
      )
      .addTestStep(
        TestStepBuilder.sampleRequestWithoutAuth(endpoint, "ADMIN_USER")
          .addAuth(endpoint, "NON-ADMIN_USER")
          .assert({
            type: AssertionType.enum.EQ,
            key: "resp.status",
            value: [401, 403, 404],
          }),
      )
  },
}
