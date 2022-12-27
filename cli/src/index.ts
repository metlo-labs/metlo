#!/usr/bin/env node

import { program } from "commander"
import init from "./init"
import { awsTrafficMirrorSetup } from "./aws/setup"
import { awsTrafficMirrorList } from "./aws/list"
import { awsTrafficMirrorRemove } from "./aws/remove"
import { gcpTrafficMirrorSetup } from "./gcp/setup"
import { gcpTrafficMirrorList } from "./gcp/list"
import { gcpTrafficMirrorDelete } from "./gcp/remove"
import { gcpTrafficMirrorCleanUp } from "./gcp/cleanup"
import { generateTest } from "./testing/generate"
import { runTests } from "./testing/run"

program.name("metlo").description("Metlo's command line tool.").version("0.1.4")

program
  .command("init")
  .description("Initialize the Metlo CLI.")
  .option("-b, --backend_url <string>", "The backend address for Metlo")
  .option("-k, --api_key <string>", "An API key for Metlo")
  .action(init)

const test = program.command("test")
test
  .command("generate")
  .option("-p,--path <string>", "Path to generate the test at")
  .requiredOption("-t,--testType <string>", "Type of test to generate")
  .option("-v,--version <number>", "The version of the test templste")
  .requiredOption(
    "-e,--endpoint <string>",
    "The endpoint to generate this test for",
  )
  .option("-h,--host <string>", "The host to generate this test for")
  .action(generateTest)
const testRun = test.command("run")
  .argument("[paths...]", "Path to yaml test files")
  .option('-e, --endpoint [endpoint]', 'endpoint pattern or uuid')
  .option('-n, --host [hostname]', 'hostname for which tests are to be run.')
  .option("-k, --api_key [string]", "[Optional] An API key for Metlo. If not provided, metlo cli will look in /opt/metlo/credentials for an api key")
  .option("-u, --url <string>", "Your Metlo instance URL")
  .action(runTests)

const trafficMirror = program
  .command("traffic-mirror")
  .description("Set up traffic mirroring for metlo")

const trafficMirrorAws = trafficMirror
  .command("aws")
  .description("Set up traffic mirroring for AWS")
trafficMirrorAws.command("new").action(awsTrafficMirrorSetup)
trafficMirrorAws.command("list").action(awsTrafficMirrorList)
trafficMirrorAws.command("remove").action(awsTrafficMirrorRemove)

const trafficMirrorGcp = trafficMirror
  .command("gcp")
  .description("Set up traffic mirroring for GCP")
trafficMirrorGcp
  .command("new")
  .action(gcpTrafficMirrorSetup)
  .option("-f,--force", "Force creation of new instance")
trafficMirrorGcp.command("list").action(gcpTrafficMirrorList)
trafficMirrorGcp.command("remove").action(gcpTrafficMirrorDelete)
trafficMirrorGcp.command("cleanup").action(gcpTrafficMirrorCleanUp)

program.parseAsync()
