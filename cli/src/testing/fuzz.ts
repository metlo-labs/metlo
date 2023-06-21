import dotenv from "dotenv"
import axios from "axios"
import chalk from "chalk"
import fs from "fs"
import { GenTestEndpoint, TestBuilder, TestStepBuilder } from "@metlo/testing"
import { getConfig } from "../utils"
import { urlJoin } from "./utils"
import { TestConfigResp, runTestConfigs } from "./run"

const config = {
  hosts: {},
  actors: {},
  resources: {},
  permissions: [],
}

const attackBuilder = (endpoint, type) =>
  new TestBuilder()
    .setMeta({
      name: `${endpoint.path} ${type} TIME BASED`,
      severity: "HIGH",
    })
    .setOptions({
      stopOnFailure: true,
    })
    .addTestStep(
      TestStepBuilder.sampleRequest(endpoint, config)
        .addPayloads({
          key: "ATTACK_PAYLOAD",
          value: type,
        })
        .modifyRequest(req => {
          if (req.query && req.query.length > 0) {
            req.query[0].value = "{{ATTACK_PAYLOAD}}"
            return req
          }
          if (req.form && req.form.length > 0) {
            req.form[0].value = "{{ATTACK_PAYLOAD}}"
            return req
          }
          if (
            req.data &&
            req.headers?.find(e => e.name == "Content-Type")?.value ==
              "application/json"
          ) {
            const parsed = JSON.parse(req.data)
            const keys = Object.keys(parsed)
            if (keys.length > 0) {
              parsed[keys[0]] = "{{ATTACK_PAYLOAD}}"
            }
            req.data = JSON.stringify(parsed, null, 4)
            return req
          }
          return req
        })
        .assert("resp.duration < 1000"),
    )

export const fuzzAttacks = async ({
  host,
  verbose,
  envfile,
  env,
}: {
  host: string
  verbose: boolean
  envfile: string
  env: Record<string, string>
}) => {
  const config = getConfig()

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

  const url = urlJoin(config.metloHost, "api/v1/gen-test-endpoints")
  let endpointsRes: GenTestEndpoint[] = []
  try {
    endpointsRes = (
      await axios.get(url, {
        headers: { Authorization: config.apiKey },
        params: { host },
      })
    )?.data
  } catch (err) {
    console.log(chalk.red("Couldn't fetch endpoints from Metlo's backend"))
    if (verbose) {
      console.log(chalk.red(err))
    }
    return
  }

  const attacks = ["SQLI_TIME", "XSS"]
  const tests: TestConfigResp[] = []
  for (const endpoint of endpointsRes) {
    for (const attack of attacks) {
      const test = attackBuilder(endpoint, attack).getTest()
      tests.push({
        uuid: "",
        apiEndpointUuid: endpoint.uuid,
        method: endpoint.method,
        host: endpoint.host,
        path: endpoint.path,
        test,
      })
    }
  }
  await runTestConfigs(tests, initEnv, verbose)
}
