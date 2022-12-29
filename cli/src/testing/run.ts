import axios from "axios"
import chalk from "chalk"
import path from "path"
import ora from "ora"

import {
  getFailedAssertions,
  getFailedRequests,
  loadTestConfig,
  runTest,
  TestConfig,
  TestConfigSchema,
  TestResult,
} from "@metlo/testing"
import { getConfig } from "../utils"

const spinner = ora()

export const runTests = async (
  paths: string[],
  { endpoint, host }: { endpoint: string; host: string },
) => {
  if (paths && paths.length) {
    await runTestPath(paths)
    return
  }
  if (!endpoint && !host) {
    console.log(chalk.bold.red("Must specify a test file, endpoint or host..."))
    return
  }
  await runTestsFromEndpointInfo(endpoint, host)
}

const runTestPath = async (paths: string[]) => {
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
      const failedRequests = getFailedRequests(res)
      for (const failure of failedRequests) {
        console.log(
          chalk.bold.red(
            `Request ${failure.stepIdx} Failed With Error "${failure.err}":`,
          ),
        )
        console.log(chalk.red(JSON.stringify(failure.req, null, 4)))
      }
      for (const failure of failedAssertions) {
        console.log(
          chalk.bold.red(
            `Request ${failure.stepIdx} Assertion ${failure.assertionIdx} Failed:`,
          ),
        )
        console.log(chalk.red(JSON.stringify(failure.assertion, null, 4)))
      }
    }
  }
}

const runTestsFromEndpointInfo = async (endpoint: string, host: string) => {
  const config = getConfig()
  let url = path.join(config.metloHost, "api/v1/testing/by-endpoint/list")
  const { data: configs } = await axios.get<TestConfig[]>(url, {
    headers: { Authorization: config.apiKey },
    params: {
      endpoint,
      host,
    },
  })
  await runTestConfigs(configs)
}

const runTestConfigs = async (tests: TestConfig[]) => {
  const results: TestResult[] = []
  let idx = 1
  for (const test of tests) {
    const parsedTest = TestConfigSchema.safeParse(test)
    if (parsedTest.success) {
      spinner.start(chalk.dim(`Running test ${idx}...`))
      const res = await runTest(parsedTest.data)
      results.push(res)
      spinner.succeed(chalk.green("Done running test..."))
      spinner.stop()
      if (res.success) {
        console.log(chalk.bold.green("All Tests Succeeded!"))
      } else {
        console.log(chalk.bold.red("Some Tests Failed."))
      }
    } else {
      console.log(chalk.redBright.bold("Error in parsing test..."))
    }
    idx++
  }
}