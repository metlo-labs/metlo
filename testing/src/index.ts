import chalk from "chalk"
import yaml from "js-yaml"
import fs from "fs"
import ora from "ora"

import { TestConfig, TestConfigSchema } from "./types/test"
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

export const runTestPath = async (paths: string[]) => {
  for (let path of paths) {
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
      console.log(JSON.stringify(res.results, null, 4))
    }
  }
}

export { AssertionType } from "./types/enums"
export {
  KeyValType,
  TestConfig,
  TestRequest,
  TestResult,
  TestConfigSchema,
} from "./types/test"
export { runTest } from "./runner"
