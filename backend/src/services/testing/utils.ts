import { AuthType } from "@common/enums"
import { TestRequest, KeyValType } from "@metlo/testing"
import { ApiEndpoint, AuthenticationConfig } from "models"

export const addAuthToRequest = (
  req: TestRequest,
  authConfig: AuthenticationConfig,
  valPrefix?: string,
): [TestRequest, KeyValType[]] => {
  let env: KeyValType[] = []
  const pre = valPrefix ? valPrefix + "_" : ""
  if (authConfig.authType == AuthType.BASIC) {
    req.headers = (req.headers || []).concat({
      name: "Authorization",
      value: `Basic {{${pre}BASIC_AUTH_CRED}}`,
    })
    env.push({
      name: `${pre}BASIC_AUTH_CRED`,
      value: `<<${pre}BASIC_AUTH_CRED>>`,
    })
  } else if (authConfig.authType == AuthType.HEADER) {
    req.headers = (req.headers || []).concat({
      name: authConfig.headerKey,
      value: `{{${pre}CREDENTIALS}}`,
    })
    env.push({
      name: `${pre}CREDENTIALS`,
      value: `<<${pre}CREDENTIALS>>`,
    })
  } else if (authConfig.authType == AuthType.JWT) {
    req.headers = (req.headers || []).concat({
      name: authConfig.headerKey,
      value: `{{${pre}JWT}}`,
    })
    env.push({
      name: `${pre}JWT`,
      value: `<<${pre}JWT>>`,
    })
  }
  return [req, env]
}

export const makeTestRequest = (
  endpoint: ApiEndpoint,
  valPrefix?: string,
): [TestRequest, KeyValType[]] => {
  const pre = valPrefix ? valPrefix + "_" : ""
  let env: KeyValType[] = []
  const paramRegex = new RegExp("{(.*)}", "g")
  const params = endpoint.path.matchAll(paramRegex)
  for (const param of params) {
    env.push({
      name: `${pre}${param[1]}`,
      value: `<<${pre}${param[1]}>>`,
    })
  }
  const req = {
    method: endpoint.method,
    url: `https://${endpoint.host}` + endpoint.path.replace(paramRegex, `{{${pre}$1}}`),
  }
  return [req, env]
}
