#!/usr/bin/env node

import { program } from "commander"
import { awsTrafficMirrorSetup } from "./aws/setup"
import init from "./init"
import testAPI from "./testAPI"

program.name("metlo").description("Metlo's command line tool.").version("0.0.0")

program
  .command("init")
  .description("Initialize the Metlo CLI.")
  .option("-b, --backend_url <string>", "The backend address for Metlo")
  .option("-k, --api_key <string>", "An API key for Metlo")
  .action(init)
program
  .command("test")
  .description("Run Metlo API tests against a specified host.")
  .requiredOption("-h, --host <string>", "The production host in Metlo.")
  .option("-t, --target <string>", "The host to run tests against against.")
  .action(testAPI)
const trafficMirror = program
  .command("traffic-mirror")
  .description("Set up traffic mirroring for metlo")
trafficMirror.command("aws").action(awsTrafficMirrorSetup)

program.parseAsync()
