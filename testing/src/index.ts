import chalk from "chalk"
import yaml from "js-yaml"
import fs from "fs"

import {
  AssertionType as ZAssertionType,
  ExtractorType as ZExtractorType,
} from "./types/enums"
import {
  FailedAssertion,
  FailedRequest,
  TestConfig,
  TestConfigSchema,
  TestResult,
} from "./types/test"

export const dumpTestConfig = (config: TestConfig): string => {
  const parts: any[] = [
    {
      id: config.id,
    },
  ]
  if (config.meta) {
    parts.push({ meta: config.meta })
  }
  if (config.env) {
    parts.push({ env: config.env })
  }
  if (config.test) {
    parts.push({ test: config.test })
  }
  return parts.map(e => yaml.dump(e)).join("\n")
}

export const loadTestConfig = (path: string): TestConfig => {
  const data = yaml.load(fs.readFileSync(path, "utf8"))
  const parseRes = TestConfigSchema.safeParse(data)
  if (!parseRes.success) {
    console.log(chalk.bold.red("Failed to load test..."))
    throw new Error(JSON.stringify(parseRes.error.flatten(), null, 4))
  }
  return parseRes.data
}

export const getFailedAssertions = (res: TestResult) => {
  if (!res.test) {
    throw new Error("Result doesn't have test")
  }
  const test = res.test
  let failedAssertions: FailedAssertion[] = []
  res.results.forEach((steps, stepIdx) => {
    steps.forEach((stepRun, stepRunIdx) => {
      stepRun.assertions.forEach((success, assertionIdx) => {
        if (!success) {
          failedAssertions.push({
            stepIdx,
            stepRunIdx,
            assertionIdx,
            ctx: stepRun.ctx,
            assertion: (test.test[stepIdx].assert || [])[assertionIdx],
            res: stepRun.res,
          })
        }
      })
    })
  })
  return failedAssertions
}

export const getFailedRequests = (res: TestResult) => {
  if (!res.test) {
    throw new Error("Result doesn't have test")
  }
  const test = res.test
  let failedRequests: FailedRequest[] = []
  res.results.forEach((steps, stepIdx) => {
    steps.forEach((stepRun, stepRunIdx) => {
      if (!stepRun.success && stepRun.err) {
        failedRequests.push({
          stepIdx: stepIdx,
          stepRunIdx: stepRunIdx,
          req: test.test[stepIdx].request,
          ctx: stepRun.ctx,
          err: stepRun.err,
        })
      }
    })
  })
  return failedRequests
}

export const AssertionType = ZAssertionType.enum
export const ExtractorType = ZExtractorType.enum
export {
  KeyValType,
  TestConfig,
  TestRequest,
  TestResult,
  TestConfigSchema,
  FailedAssertion,
  FailedRequest,
} from "./types/test"
export {
  GenTestEndpoint,
  GenTestContext,
  GeneratedTestRequest,
  GenTestEndpointDataField,
} from "./generate/types"
export { TestBuilder, TestStepBuilder } from "./generate/builder"
export { TestTemplate } from "./templates/types"
export { runTest } from "./runner"
