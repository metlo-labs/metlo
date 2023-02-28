import { TestConfig, TestConfigSchema } from "../types/test"
import { TemplateConfig } from "../types/resource_config"
import {
  authTestStepPayloadToBuilder,
  getAuthTestPayloads,
} from "./auth-test-step-gen"
import { TestBuilder } from "./builder"
import { GenTestEndpoint } from "./types"

export const generateAuthTests = (
  endpoints: GenTestEndpoint[],
  config: TemplateConfig,
) => {
  const testConfigs = []
  for (const endpoint of endpoints) {
    const testStepPayloads = getAuthTestPayloads(endpoint, config)
    const hostInfo = config.hosts[endpoint.host]
    let builder = new TestBuilder().setMeta({
      name: `${endpoint.path} VALIDATE_AUTH_RULES`,
      severity: "HIGH",
      tags: ["BOLA", "BFLA", "IDOR"],
    })
    for (let i = 0; i < testStepPayloads.length; i++) {
      builder = builder.addTestStep(
        authTestStepPayloadToBuilder(
          endpoint,
          testStepPayloads[i],
          i + 1,
          hostInfo,
        ),
      )
    }
    const parseRes = TestConfigSchema.safeParse(builder)
    if (!parseRes.success) {
      throw new Error(
        parseRes.error.issues
          .map(
            e => `Endpoint ${endpoint.method} ${endpoint.path}: ${e.message}`,
          )
          .join("\n"),
      )
    }
    testConfigs.push({
      uuid: "",
      apiEndpointUuid: endpoint.uuid,
      method: endpoint.method,
      host: endpoint.host,
      path: endpoint.path,
      test: parseRes.data,
    })
  }
  return testConfigs
}
