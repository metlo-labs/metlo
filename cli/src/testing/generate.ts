import fs from "fs"
import path from "path"
import chalk from "chalk"
import axios from "axios"
import { getConfig } from "../utils"
import { TestConfig, dumpTestConfig, GenTestEndpoint } from "@metlo/testing"
import { TEMPLATES } from "@metlo/testing/dist/templates"
import groupBy from "lodash.groupby"

const TYPE_TO_TEMPLATES = groupBy(TEMPLATES, e => e.name)

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
  version,
}) => {
  const config = getConfig()
  const res = await axios.get<GenTestEndpoint>(
    path.join(config.metloHost, "api/v1/gen-test-endpoint"),
    {
      params: {
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
  const genTestEndpoint = res.data
  const templates = TYPE_TO_TEMPLATES[testType.toUpperCase()]
  if (!templates) {
    console.log(chalk.bold.red(`INVALID TEMPLATE TYPE: ${testType}`))
    return
  }
  const sortedTemplates = templates.sort((a, b) => b.version - a.version)
  let template = sortedTemplates[0]
  if (version) {
    template = sortedTemplates.find(e => e.version == version)
  }
  if (!template) {
    console.log(
      chalk.bold.red(`INVALID VERSION FOR TEMPLATE "${testType}": ${version}`),
    )
    return
  }
  const test = template.builder(genTestEndpoint).getTest()
  const testYaml = dumpTestConfig(test)
  if (filePath) {
    fs.writeFileSync(filePath, testYaml)
    console.log(
      chalk.bold.green(`Success! Wrote test template to "${filePath}"`),
    )
  } else {
    console.log(testYaml)
  }
}
