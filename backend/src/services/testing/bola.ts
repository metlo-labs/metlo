import { v4 as uuidv4 } from "uuid"
import { GenerateTestRes } from "@common/types"
import { ApiEndpoint, AuthenticationConfig } from "models"
import { KeyValType, TestConfig, AssertionType } from "@metlo/testing"
import { MetloContext } from "types"
import { getRepository } from "services/database/utils"
import { addAuthToRequest, makeTestRequest } from "./utils"

export const generateBolaTest = async (
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
    val: [401, 403],
  }
  const authAssertion = {
    type: AssertionType.enum.JS,
    val: "resp.status < 400",
  }

  const [unauthUserAReq, userAReqEnv] = makeTestRequest(endpoint, "USER_A")
  if (userAReqEnv.length > 0) {
    env = (env || []).concat(...userAReqEnv)
  }
  const [unauthUserBReq, userBReqEnv] = makeTestRequest(endpoint, "USER_B")
  if (userBReqEnv.length > 0) {
    env = (env || []).concat(...userBReqEnv)
  }

  const [authUserAReq, userAAuthEnv] = addAuthToRequest(
    { ...unauthUserAReq },
    authConfig,
    "USER_A",
  )
  if (userAAuthEnv.length > 0) {
    env = (env || []).concat(...userAAuthEnv)
  }
  const [bolaUserAReq, bolaUserAEnv] = addAuthToRequest(
    { ...unauthUserAReq },
    authConfig,
    "USER_B",
  )

  const [authUserBReq, userBAuthEnv] = addAuthToRequest(
    { ...unauthUserBReq },
    authConfig,
    "USER_B",
  )
  if (userBAuthEnv.length > 0) {
    env = (env || []).concat(...userBAuthEnv)
  }
  const [bolaUserBReq, bolaUserBEnv] = addAuthToRequest(
    { ...unauthUserAReq },
    authConfig,
    "USER_B",
  )

  let test: TestConfig = {
    id: uuidv4(),
    meta: {
      name: `${endpoint.path} Broken Authentication`,
      severity: "HIGH",
      tags: ["BOLA"],
    },
    env,
    test: [
      {
        request: authUserAReq,
        assert: [authAssertion],
      },
      {
        request: authUserBReq,
        assert: [authAssertion],
      },
      {
        request: bolaUserAReq,
        assert: [unauthAssertion],
      },
      {
        request: bolaUserBReq,
        assert: [unauthAssertion],
      },
    ],
  }
  return {
    success: true,
    test,
  }
}
