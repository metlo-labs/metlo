import path from "path"
import chalk from "chalk"
import axios from "axios"
import { getConfig } from "../utils"
import { TestConfig } from "@metlo/testing"

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
  console.log(res.data)
  if (!res.data.success) {
    console.log(chalk.bold.red(`Failed to generate test - ${res.data.msg}`))
    return
  }
  console.log(res.data.test)
}
