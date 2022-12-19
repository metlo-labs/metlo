import { v4 as uuidv4 } from "uuid"
import { GenerateTestRes } from "@common/types"
import { ApiEndpoint } from "models"
import { TestConfig, AssertionType } from "@metlo/testing"
import path from "path"

export const generateBrokenAuthTest = (
  endpoint: ApiEndpoint,
): GenerateTestRes => {
  const dataFields = endpoint.dataFields
  const unauthAssertion = {
    type: AssertionType.enum.EQ,
    key: "status",
    val: [401, 403],
  }
  const authAssertion = {
    type: AssertionType.enum.JS,
    val: "status < 400",
  }
  const unauthRequest = {
    method: endpoint.method,
    url: path.join(`https://${endpoint.host}`, endpoint.path),
  }
  let authRequest = { ...unauthRequest }

  let test: TestConfig = {
    id: uuidv4(),
    meta: {
      name: `${endpoint.path} Broken Authentication`,
      severity: "HIGH",
      tags: ["BROKEN_AUTHENTICATION"],
    },
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
