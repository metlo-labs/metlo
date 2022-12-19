import { v4 as uuidv4 } from "uuid"
import { GenerateTestRes } from "@common/types"
import { ApiEndpoint, AuthenticationConfig } from "models"
import { KeyValType, TestConfig, AssertionType } from "@metlo/testing"
import { MetloContext } from "types"
import { getRepository } from "services/database/utils"
import { addAuthToRequest, makeTestRequest } from "./utils"

export const generateGenericTest = async (
  ctx: MetloContext,
  endpoint: ApiEndpoint,
): Promise<GenerateTestRes> => {
  const authConfigRepo = getRepository(ctx, AuthenticationConfig)
  const authConfig = await authConfigRepo.findOneBy({
    host: endpoint.host,
  })

  let env: KeyValType[] | undefined = undefined

  let [req, reqEnv] = makeTestRequest(endpoint)
  if (reqEnv.length > 0) {
    env = (env || []).concat(...reqEnv)
  }

  if (authConfig) {
    const [authRequest, authEnv] = addAuthToRequest({ ...req }, authConfig)
    req = authRequest
    if (authEnv.length > 0) {
      env = (env || []).concat(...authEnv)
    }
  }

  let test: TestConfig = {
    id: uuidv4(),
    meta: {
      name: `${endpoint.path} Test`,
      severity: "LOW",
    },
    env,
    test: [
      {
        request: req,
      },
    ],
  }
  return {
    success: true,
    test,
  }
}
