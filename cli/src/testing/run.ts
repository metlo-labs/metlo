import axios from "axios"
import chalk from "chalk"
import dotenv from "dotenv"
import fs from "fs"
import ora from "ora"
import groupBy from "lodash.groupby"

import {
  getFailedAssertions,
  getFailedRequests,
  loadTestConfig,
  runTest,
  estimateTest,
  TestConfig,
  TestConfigSchema,
  TestResult,
} from "@metlo/testing"
import { getConfig } from "../utils"
import { urlJoin } from "./utils"
import { prompt } from "enquirer"

const spinner = ora()

export const runTests = async (
  paths: string[],
  {
    endpoint,
    method,
    host,
    verbose,
    envfile,
    env,
  }: {
    endpoint: string
    method: string
    host: string
    verbose: boolean
    envfile: string
    env: Record<string, string>
  },
) => {
  let initEnv: { [key: string]: string } = {}
  if (envfile) {
    initEnv = dotenv.parse(fs.readFileSync(envfile, "utf8"))
    console.log(
      chalk.gray(
        `Loaded ${Object.keys(initEnv).length} env vars at path ${envfile}`,
      ),
    )
  }
  if (env) {
    initEnv = { ...initEnv, ...env }
  }
  // get global env
  let globalEnv = []
  try {
    const config = getConfig()
    let url = urlJoin(config.metloHost, "api/v1/testing/global-env")
    const { data } = await axios.get<{ name: string; value: any }[]>(url, {
      headers: { Authorization: config.apiKey },
    })
    globalEnv = data
  } catch (err) {
    console.log(
      chalk.red("Couldn't fetch global test environment from Metlo's backend"),
    )
    if (verbose) {
      console.warn(err)
    }
  }

  if (paths && paths.length) {
    await runTestPath(paths, verbose, {
      ...initEnv,
      global: Object.fromEntries(globalEnv.map(env => [env.name, env.value])),
    })
    return
  }
  await runTestsFromEndpointInfo(endpoint, method, host, initEnv, verbose)
}

const UPPER_ESTIMATE_LIMIT = 250

const runTestPath = async (
  paths: string[],
  verbose: boolean,
  env: { [key: string]: string | Object },
) => {
  for (let path of paths) {
    console.log(chalk.gray(`Running test at path "${path}":`))
    const test = loadTestConfig(path)

    const estimate = estimateTest(test, env)
    let res: TestResult
    if (estimate > UPPER_ESTIMATE_LIMIT) {
      const { _continue }: { _continue: boolean } = await prompt([
        {
          type: "confirm",
          name: "_continue",
          message: `Estimated request count is high (${estimate}). Would you like to continue?`,
        },
      ])
      if (!_continue) {
        console.log(chalk.redBright("Exiting ..."))
        return
      }
    }

    spinner.start(chalk.dim("Running test..."))
    res = await runTest(test, env)
    spinner.succeed(chalk.green("Done running test..."))
    spinner.stop()

    if (res.success) {
      console.log(chalk.bold.green("All Tests Succeeded!"))
    } else if (res.abortedAt) {
      console.log(
        chalk.bold.redBright(`Tests aborted due to assertion failure`),
      )
      const failedAssertions = getFailedAssertions(res)
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
        console.log(chalk.red(JSON.stringify(failure.stepReq, null, 4)))
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
        if (verbose) {
          console.log(
            chalk.red(
              JSON.stringify(
                {
                  ctx: failure.ctx,
                  request: failure.stepReq,
                  response: failure.res,
                },
                null,
                4,
              ),
            ),
          )
        }
      }
      if (!verbose) {
        console.log(chalk.dim("Use the --verbose flag for more information."))
      }
      process.exit(1)
    }
  }
}

interface TestConfigResp {
  uuid: string
  apiEndpointUuid: string
  method: string
  host: string
  path: string
  test: TestConfig
}

const runTestsFromEndpointInfo = async (
  endpoint: string,
  method: string,
  host: string,
  env: { [key: string]: string },
  verbose: boolean,
) => {
  const config = getConfig()
  let url = urlJoin(config.metloHost, "api/v1/tests-by-endpoint")
  const { data: configs } = await axios.get<TestConfigResp[]>(url, {
    headers: { Authorization: config.apiKey },
    params: {
      method,
      endpoint,
      host,
    },
  })
  if (configs.length == 0) {
    let warnMsg = "No tests found for"
    if (method) {
      warnMsg = `${warnMsg} method "${method}"`
    }
    if (endpoint) {
      warnMsg = `${warnMsg} endpoint "${endpoint}"`
    }
    if (host) {
      warnMsg = `${warnMsg} host "${host}"`
    }
    console.log(chalk.bold.dim(`${warnMsg}.`))
    return
  }
  await runTestConfigs(configs, env, verbose)
}

interface TestResWithUUID {
  uuid: string
  apiEndpointUuid: string
  method: string
  path: string
  host: string
  result: TestResult
}

const runTestConfigs = async (
  tests: TestConfigResp[],
  env: { [key: string]: string },
  verbose: boolean,
) => {
  const results: TestResWithUUID[] = []

  spinner.start(chalk.dim(`Running tests...`))
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    const parsedTest = TestConfigSchema.safeParse(test.test)
    if (parsedTest.success) {
      const res = await runTest(parsedTest.data, env)
      results.push({
        uuid: test.uuid,
        method: test.method,
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
        e => `${e.method} ${e.host}${e.path}`,
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
