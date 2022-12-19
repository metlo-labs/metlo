import fs from "fs"
import path from "path"
import chalk from "chalk"
import axios from "axios"
import { getConfig } from "../utils"
import { TestConfig, dumpTestConfig } from "@metlo/testing"

export interface GenerateTestRes {
  success: boolean
  msg?: string
  test?: TestConfig
}

export const generateTest = async ({
  path: filePath,
  testType,
  host,
  endpoint,
}) => {
  const config = getConfig()
  const res = await axios.get<GenerateTestRes>(
    path.join(config.metloHost, "api/v1/generate-test"),
    {
      params: {
        type: testType,
        endpoint: endpoint,
        host: host,
      },
      headers: {
        Authorization: config.apiKey,
      },
      validateStatus: () => true,
    },
  )
  if (res.status > 300) {
    console.log(
      chalk.bold.red(
        `Failed to generate test [Code ${res.status}] - ${res.data}`,
      ),
    )
    return
  }
  if (!res.data.success) {
    console.log(chalk.bold.red(`Failed to generate test - ${res.data.msg}`))
    return
  }
  const testYaml = dumpTestConfig(res.data.test)
  if (filePath) {
    fs.writeFileSync(filePath, testYaml)
    console.log(chalk.bold.green(`Success! Wrote test template to "${filePath}"`))
  } else {
    console.log(testYaml)
  }
}
