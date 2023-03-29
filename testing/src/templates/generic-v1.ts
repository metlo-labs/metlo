import { GenTestEndpoint } from "../generate/types"
import { TestBuilder, TestStepBuilder } from "../generate/builder"
import { AssertionType, AuthType } from "../types/enums"
import { TemplateConfig } from "../types/resource_config"
import { getResponseAssertion } from "../generate/auth-test-step-gen"

export default {
  name: "GENERIC",
  version: 1,
  builder: (endpoint: GenTestEndpoint, config: TemplateConfig) => {
    const hostInfo = config?.hosts[endpoint.host]
    if (!endpoint.authConfig && hostInfo?.authType) {
      endpoint.authConfig = {
        authType: hostInfo.authType as AuthType,
        headerKey: hostInfo.headerKey || "",
        jwtUserPath: hostInfo.jwtUserPath || "",
        cookieName: hostInfo.cookieName || "",
      }
    }
    const responseAssertion = getResponseAssertion(hostInfo, endpoint)
    return new TestBuilder()
      .setMeta({
        name: `${endpoint.path} Test`,
        severity: "LOW",
        tags: ["GENERIC"],
      })
      .addTestStep(
        TestStepBuilder.sampleRequest(endpoint, config).assert({
          type: AssertionType.enum.JS,
          value: responseAssertion?.success || "resp.status < 300",
        }),
      )
  },
}
