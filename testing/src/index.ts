import chalk from "chalk"
import yaml from "js-yaml"
import fs from "fs"
import ora from "ora"

import {
  FailedAssertion,
  TestConfig,
  TestConfigSchema,
  TestResult,
} from "./types/test"
import { runTest } from "./runner"

const spinner = ora()

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

export const runTestPath = async (paths: string[]) => {
  for (let path of paths) {
    console.log(chalk.gray(`Running test at path "${path}":`))
    spinner.start(chalk.dim("Loading test..."))
    const test = loadTestConfig(path)
    spinner.succeed(chalk.green("Done loading test..."))
    spinner.stop()

    spinner.start(chalk.dim("Running test..."))
    const res = await runTest(test)
    spinner.succeed(chalk.green("Done running test..."))
    spinner.stop()

    if (res.success) {
      console.log(chalk.bold.green("All Tests Succeeded!"))
    } else {
      console.log(chalk.bold.red("Some Tests Failed."))
      const failedAssertions = getFailedAssertions(res)
      for (const failure of failedAssertions) {
        console.log(chalk.bold.red(`Request ${failure.stepIdx} Assertion ${failure.assertionIdx} Failed:`))
        console.log(chalk.red(JSON.stringify(failure.assertion, null, 4)))
      }
    }
  }
}

export {
  KeyValType,
  TestConfig,
  TestRequest,
  TestResult,
  TestConfigSchema,
  FailedAssertion,
} from "./types/test"
export { runTest } from "./runner"
