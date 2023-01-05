import fs from "fs"
import chalk from "chalk"
import axios from "axios"
import ts, { ModuleKind } from "typescript"
import { NodeVM } from "vm2"
import { getConfig } from "../utils"
import {
  TestConfig,
  dumpTestConfig,
  GenTestEndpoint,
  TestTemplate,
} from "@metlo/testing"
import * as MetloTesting from "@metlo/testing"
import { TEMPLATES } from "@metlo/testing/dist/templates"
import groupBy from "lodash.groupby"
import { urlJoin } from "./utils"
import { validateTemplateObj } from "./validate"

const TYPE_TO_TEMPLATES = groupBy(TEMPLATES, e => e.name)

export interface GenerateTestRes {
  success: boolean
  msg?: string
  test?: TestConfig
}

const genTestFromFile = (
  path: string,
  endpoint: GenTestEndpoint,
): [TestConfig, string] => {
  if (!fs.existsSync(path)) {
    return [null, chalk.bold.red(`INVALID PATH: "${path}"`)]
  }
  let contents = fs.readFileSync(path, {
    encoding: "utf8",
    flag: "r",
  })
  if (path.endsWith(".ts")) {
    contents = ts.transpile(contents, { module: ModuleKind.CommonJS })
  }
  const vm = new NodeVM({
    require: {
      external: true,
      mock: {
        "@metlo/testing": MetloTesting,
      },
      customRequire: module => {},
    },
    sandbox: {
      exports: {},
      endpoint,
      testing: Object.entries(MetloTesting),
      customRequire: module => {
        return MetloTesting
      },
    },
    timeout: 1000,
    allowAsync: false,
    eval: false,
    wasm: false,
  })
  const template = vm.run(contents)
  const err = validateTemplateObj(path, template)
  if (err) {
    return [null, err]
  }
  const res = vm.run(
    `${contents}\nmodule.exports = exports.default.builder(endpoint);`,
  )
  return [res, ""]
}

const getTestTemplate = (
  test: string,
  version?: number,
): [TestTemplate, string] => {
  const templates = TYPE_TO_TEMPLATES[test.toUpperCase()]
  if (!templates) {
    return [null, `INVALID TEMPLATE: "${test}"`]
  }
  const sortedTemplates = templates.sort((a, b) => b.version - a.version)
  let template = sortedTemplates[0]
  if (version) {
    template = sortedTemplates.find(e => e.version == version)
  }
  if (!template) {
    return [null, `INVALID TEMPLATE - "${test}:${version}"`]
  }
  return [template, ""]
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
    urlJoin(config.metloHost, "api/v1/gen-test-endpoint"),
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

  let testYaml = ""
  if (testType.endsWith(".js") || testType.endsWith(".ts")) {
    const [test, err] = genTestFromFile(testType, genTestEndpoint)
    if (err) {
      console.log(err)
      return
    }
    testYaml = dumpTestConfig(test)
  } else {
    const [template, err] = getTestTemplate(testType, version)
    if (err) {
      console.log(err)
      return
    }
    const test = template.builder(genTestEndpoint).getTest()
    testYaml = dumpTestConfig(test)
  }

  if (filePath) {
    fs.writeFileSync(filePath, testYaml)
    console.log(
      chalk.bold.green(`Success! Wrote test template to "${filePath}"`),
    )
  } else {
    console.log(testYaml)
  }
}
