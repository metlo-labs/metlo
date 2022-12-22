import chalk from "chalk"
import ora from "ora"

import {
  getFailedAssertions,
  getFailedRequests,
  loadTestConfig,
  runTest,
} from "@metlo/testing"

const spinner = ora()

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
