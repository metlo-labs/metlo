import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType } from "../types/enums"

export default (endpoint: GenTestEndpoint) => {
  const builder = new TestBuilder()
    .setMeta({
      name: `${endpoint.path} Test`,
      severity: "LOW",
      tags: ["BROKEN_AUTHENTICATION"],
    })
    .addTest(
      TestStepBuilder.sampleRequest(endpoint).assert({
        type: AssertionType.enum.JS,
        value: "resp.status < 300",
      }),
    )
  return builder.getTest()
}
