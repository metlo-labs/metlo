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
          .modifyRequest(req => {
            if (req.query && req.query.length > 0) {
              req.query[0].value = "{{SQLI_PAYLOAD}}"
              return req
            }
            if (req.form && req.form.length > 0) {
              req.form[0].value = "{{SQLI_PAYLOAD}}"
              return req
            }
            if (
              req.data &&
              req.headers?.find(e => e.name == "Content-Type")?.value ==
                "application/json"
            ) {
              const parsed = JSON.parse(req.data)
              const keys = Object.keys(parsed)
              if (keys.length > 0) {
                parsed[keys[0]] = "{{SQLI_PAYLOAD}}"
              }
              req.data = JSON.stringify(parsed, null, 4)
              return req
            }
            return req
          })
          .assert("resp.duration < 1000"),
      ),
}
