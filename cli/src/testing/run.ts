import axios from "axios"
import chalk from "chalk"
import { table } from "table"
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
  const results = [] as TestResult[]
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
  showTableData(results)
}

const showTableData = (res: TestResult[]) => {
  const dataConfig = {
    columns: [
      { alignment: "center", width: 10 },
      { alignment: "center", width: 10 },
      { alignment: "right" },
      { alignment: "right" },
      { alignment: "right", width: 10 },
      { alignment: "right", width: 10 },
    ],
    spanningCells: [
      { col: 0, row: 0, colSpan: 6 },
      { col: 4, row: 1, colSpan: 2, verticalAlignment: "middle" },
    ],
  } as Record<string, any>
  let rowCount = 2
  const dataTableBase = [
    ["Tests Status", "", "", "", "", ""],
    ["Test", "Request", "Assertion", "Successes/Failure", "Error", ""],
  ]

  const data = []

  res.forEach((testRes, i1, a1) => {
    let totalTestRows = 0
    let startingRow = rowCount
    let totalSucceeded = 0
    let totalFailed = 0
    testRes.results.map((requestRes, i2, a2) => {
      dataConfig.spanningCells.push({
        col: 1,
        row: rowCount,
        rowSpan: requestRes[0].assertions.length || 1,
      })
      if (requestRes[0].assertions.length == 0) {
        data.push([
          i1 + 1,
          i2 + 1,
          1,
          chalk.redBright("✘"),
          JSON.stringify(requestRes[0].err, null, 4),
          "",
        ])
        dataConfig.spanningCells.push({ col: 4, row: rowCount, colSpan: 2 })
        rowCount += 1
        totalTestRows += 1
        totalFailed += 1
      }
      // RequestRes is always 1 element deep if no branching happens
      requestRes[0].assertions.map((assertionRes, i3, a3) => {
        if (assertionRes) {
          totalSucceeded += 1
        } else {
          totalFailed += 1
        }
        if (i3 == 0) {
          data.push([
            i1 + 1,
            i3 == 0 ? i2 + 1 : "",
            i3 + 1,
            assertionRes ? chalk.green("✓") : chalk.redBright("✘"),
            assertionRes ? "" : JSON.stringify(assertionRes, null, 4),
            "",
          ])
        } else {
          data.push([
            "",
            "",
            i3 + 1,
            assertionRes ? chalk.green("✓") : chalk.redBright("✘"),
            "",
            "",
          ])
        }
        dataConfig.spanningCells.push({ col: 4, row: rowCount, colSpan: 2 })
        rowCount += 1
        totalTestRows += 1
      })
    })
    data.push([
      chalk.gray("Succeeded"),
      chalk.green(`${totalSucceeded}/${totalFailed + totalSucceeded}`),
      "",
      chalk.gray("Failed"),
      chalk.redBright(`${totalFailed}/${totalSucceeded + totalFailed}`),
      "",
    ])
    dataConfig.spanningCells.push({
      col: 0,
      row: startingRow,
      rowSpan: totalTestRows || 1,
    })
    dataConfig.spanningCells.push({ col: 1, row: rowCount, colSpan: 2 })
    dataConfig.spanningCells.push({ col: 4, row: rowCount, colSpan: 2 })
    rowCount += 1
  })

  console.log(table([...dataTableBase, ...data], dataConfig))
}
