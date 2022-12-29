import axios from "axios"
import chalk from "chalk"
import ora from "ora"
import groupBy from "lodash.groupby"

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
import { urlJoin } from "./utils"

const spinner = ora()

export const runTests = async (
  paths: string[],
  {
    endpoint,
    host,
    verbose,
  }: { endpoint: string; host: string; verbose: boolean },
) => {
  if (paths && paths.length) {
    await runTestPath(paths)
    return
  }
  await runTestsFromEndpointInfo(endpoint, host, verbose)
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
            `Request ${failure.stepIdx + 1} Failed With Error "${
              failure.err
            }":`,
          ),
        )
        console.log(chalk.red(JSON.stringify(failure.req, null, 4)))
      }
      for (const failure of failedAssertions) {
        console.log(
          chalk.bold.red(
            `Request ${failure.stepIdx + 1} Assertion ${
              failure.assertionIdx + 1
            } Failed:`,
          ),
        )
        console.log(chalk.red(JSON.stringify(failure.assertion, null, 4)))
      }
    }
  }
}

interface TestConfigResp {
  uuid: string
  apiEndpointUuid: string
  host: string
  path: string
  test: TestConfig
}

const runTestsFromEndpointInfo = async (
  endpoint: string,
  host: string,
  verbose: boolean,
) => {
  const config = getConfig()
  let url = urlJoin(config.metloHost, "api/v1/tests-by-endpoint")
  const { data: configs } = await axios.get<TestConfigResp[]>(url, {
    headers: { Authorization: config.apiKey },
    params: {
      endpoint,
      host,
    },
  })
  if (configs.length == 0) {
    let warnMsg = "No tests found for"
    if (endpoint) {
      warnMsg = `${warnMsg} endpoint "${endpoint}"`
    }
    if (host) {
      warnMsg = `${warnMsg} host "${host}"`
    }
    console.log(chalk.bold.dim(`${warnMsg}.`))
    return
  }
  await runTestConfigs(configs, verbose)
}

interface TestResWithUUID {
  uuid: string
  apiEndpointUuid: string
  path: string
  host: string
  result: TestResult
}

const runTestConfigs = async (tests: TestConfigResp[], verbose: boolean) => {
  const results: TestResWithUUID[] = []

  spinner.start(chalk.dim(`Running tests...`))
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    const parsedTest = TestConfigSchema.safeParse(test.test)
    if (parsedTest.success) {
      const res = await runTest(parsedTest.data)
      results.push({
        uuid: test.uuid,
        host: test.host,
        path: test.path,
        apiEndpointUuid: test.apiEndpointUuid,
        result: res,
      })
    } else {
      console.log(chalk.redBright.bold(`Error parsing test: ${test.uuid}...`))
    }
  }
  const totalTests = results.length
  const failedTests = results.filter(e => !e.result.success).length
  const successTests = results.filter(e => e.result.success).length
  if (failedTests) {
    spinner.fail(chalk.bold.red(`${failedTests}/${totalTests} tests failed...`))
    const config = getConfig()
    Object.entries(
      groupBy(
        results.filter(e => !e.result.success),
        e => `${e.host}${e.path}`,
      ),
    ).forEach(([key, results]) => {
      console.log(
        chalk.bold.red(`${results.length} tests failed on endpoint ${key}:`),
      )
      results.forEach(res => {
        console.log(
          chalk.red(
            urlJoin(
              config.metloHost,
              `/endpoint/${res.apiEndpointUuid}/test/${res.uuid}`,
            ),
          ),
        )
        if (verbose) {
          const failedAssertions = getFailedAssertions(res.result)
          const failedRequests = getFailedRequests(res.result)
          for (const failure of failedRequests) {
            console.log(
              chalk.bold.dim(
                `Request ${failure.stepIdx + 1} Failed With Error "${
                  failure.err
                }":`,
              ),
            )
            console.log(chalk.red(JSON.stringify(failure.req, null, 4)))
          }
          for (const failure of failedAssertions) {
            console.log(
              chalk.bold.dim(
                `Request ${failure.stepIdx + 1} Assertion ${
                  failure.assertionIdx + 1
                } Failed:`,
              ),
            )
            console.log(chalk.dim(JSON.stringify(failure.assertion, null, 4)))
          }
        }
      })
      console.log()
    })
    if (!verbose) {
      console.log(chalk.dim("Use the --verbose flag for more information."))
    }
    process.exit(1)
  } else {
    spinner.succeed(
      chalk.green(`${successTests}/${totalTests} tests succeeded...`),
    )
  }
}
