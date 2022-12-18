import chalk from "chalk"
import yaml from "js-yaml"
import fs from "node:fs"

import { TestConfig, TestConfigSchema } from "./types/test"
import { runTest } from "./runner"

export const loadTestConfig = (path: string): TestConfig => {
  const data = yaml.load(fs.readFileSync(path, "utf8"))
  const parseRes = TestConfigSchema.safeParse(data)
  if (!parseRes.success) {
    console.log(chalk.bold.red("Failed to load test..."))
    throw new Error(JSON.stringify(parseRes.error.flatten(), null, 4))
  }
  return parseRes.data
}

export const runTestPath = (path: string) => {
  console.log(chalk.dim("Loading test..."))
  const test = loadTestConfig(path)
  console.log(chalk.dim("Running test..."))
  const res = runTest(test)
}

runTestPath("../.meta/test.yaml")
