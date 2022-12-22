import { v4 as uuidv4 } from "uuid"
import { GenerateTestRes } from "@common/types"
import { ApiEndpoint, AuthenticationConfig } from "models"
import { KeyValType, TestConfig, AssertionType } from "@metlo/testing"
import { MetloContext } from "types"
import { getRepository } from "services/database/utils"
import { addAuthToRequest, makeTestRequest } from "./utils"

export const generateBrokenAuthTest = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
): Promise<GenerateTestRes> => {
  const authConfigRepo = getRepository(ctx, AuthenticationConfig)
  const authConfig = await authConfigRepo.findOneBy({
    host: endpoint.host,
  })
  if (!authConfig) {
    return {
      success: false,
      msg: `No auth config defined for host: "${endpoint.host}"`,
    }
  }

  let env: KeyValType[] | undefined = undefined

  const unauthAssertion = {
    type: AssertionType.enum.EQ,
    key: "resp.status",
    value: [401, 403],
  }
  const authAssertion = {
    type: AssertionType.enum.JS,
    value: "resp.status < 400",
  }

  const [unauthRequest, reqEnv] = makeTestRequest(endpoint)
  if (reqEnv.length > 0) {
    env = (env || []).concat(...reqEnv)
  }

  const [authRequest, authEnv] = addAuthToRequest(
    { ...unauthRequest },
    authConfig,
  )
  if (authEnv.length > 0) {
    env = (env || []).concat(...authEnv)
  }

  let test: TestConfig = {
    id: uuidv4(),
    meta: {
      name: `${endpoint.path} Broken Authentication`,
      severity: "HIGH",
      tags: ["BROKEN_AUTHENTICATION"],
    },
    env,
    test: [
      {
        request: unauthRequest,
        assert: [unauthAssertion],
      },
      {
        request: authRequest,
        assert: [authAssertion],
      },
    ],
  }
  return {
    success: true,
    test,
  }
}
