import axios from "axios"
import chalk from "chalk"
import { getConfig } from "./utils"

import { Test, runTest, TestResult, Result } from "@metlo/testing"

interface testAPIArgs {
  host: string
  target: string
}

interface APIEndpoint {
  method: string
  host: string
  path: string
}

interface TestResponse extends Test {
  apiEndpoint: APIEndpoint
}

const getTests = async (args: testAPIArgs): Promise<TestResponse[]> => {
  const config = getConfig()
  const testResponse = await axios.get<TestResponse[]>(
    `${config.metloHost}/api/v1/test/list?hostname=${args.host}`,
  )
  return testResponse.data
}

const testAPI = async (args: testAPIArgs) => {
  try {
    const tests = await getTests(args)
    const outputs = await Promise.all(tests.map(runTest))
    const testWithOutputs: [TestResponse, Result[]][] = outputs.map((e, i) => [
      tests[i],
      e,
    ])
    let headerToFailures = new Map<string, TestResult[]>()
    testWithOutputs.forEach(([test, results]) => {
      const name = `${chalk.red(test.name)}\n${test.apiEndpoint.method} ${test.apiEndpoint.path}`
      const failureResults = results
        .flatMap(e => e.testResults)
        .filter(e => !e.success)
      if (failureResults.length > 0) {
        let currentFailures = headerToFailures.get(name) || []
        currentFailures.push(...failureResults)
        headerToFailures.set(name, currentFailures)
      }
    })
    let output = ""
    headerToFailures.forEach((testResults, key) => {
      output += `${key}\n\n`
      output += testResults.map(e => e.output).join("\n")
    })
    if (output.length > 0) {
      console.log(chalk.red.bold("Some Tests Failed:\n"))
      console.log(output)
      process.exit(1)
    } else {
      console.log(chalk.green.bold("All tests succeeded!"))
      process.exit(0)
    }
  } catch (e) {
    console.error(e.message)
    return
  }
}

export default testAPI
