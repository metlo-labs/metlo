import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"

export default (endpoint: GenTestEndpoint) => {
  if (!endpoint.authConfig) {
    throw new Error(`No auth config defined for host: "${endpoint.host}"...`)
  }

  const builder = new TestBuilder()
    .setMeta({
      name: `${endpoint.path} Broken Authentication`,
      severity: "HIGH",
      tags: ["BROKEN_AUTHENTICATION"],
    })
    .addTest(
      TestStepBuilder.sampleRequest(endpoint).assert({
        type: AssertionType.enum.JS,
        value: "resp.status < 300",
      }),
    )
    .addTest(
      TestStepBuilder.sampleRequestWithoutAuth(endpoint).assert({
        type: AssertionType.enum.EQ,
        key: "resp.status",
        value: [401, 403],
      }),
    )

  return builder.getTest()
}
