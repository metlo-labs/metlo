import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"

export default {
  name: "SQLI_TIME_BASED",
  version: 1,
  builder: (endpoint: GenTestEndpoint) =>
    new TestBuilder()
      .setMeta({
        name: `${endpoint.path} SQLI TIME BASED`,
        severity: "HIGH",
        tags: ["SQLI_TIME_BASED"],
      })
      .setOptions({
        stopOnFailure: true,
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint)
          .addPayloads({
            key: "SQLI_PAYLOAD",
            value: "SQLI_TIME",
          })
          .assert("resp.duration < 1000"),
      ),
}
