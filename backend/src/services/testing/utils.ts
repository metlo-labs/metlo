import { AuthType } from "@common/enums"
import { TestRequest, KeyValType } from "@metlo/testing"
import { AuthenticationConfig } from "models"

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
