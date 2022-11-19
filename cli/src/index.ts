#!/usr/bin/env node

import { program } from "commander"
import { awsTrafficMirrorSetup } from "./aws/setup"
import { awsTrafficMirrorList } from "./aws/list"
import { awsTrafficMirrorRemove } from "./aws/remove"
import { gcpTrafficMirrorSetup } from "./gcp/setup"
import init from "./init"
import testAPI from "./testAPI"
import { gcpTrafficMirrorList } from "./gcp/list"
import { gcpTrafficMirrorDelete } from "./gcp/remove"
import { gcpTrafficMirrorCleanUp } from "./gcp/cleanup"

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

const trafficMirrorAws = trafficMirror
  .command("aws")
  .description("Set up traffic mirroring for AWS")
trafficMirrorAws.command("new").action(awsTrafficMirrorSetup)
trafficMirrorAws.command("list").action(awsTrafficMirrorList)
trafficMirrorAws.command("remove").action(awsTrafficMirrorRemove)

const trafficMirrorGcp = trafficMirror
  .command("gcp")
  .description("Set up traffic mirroring for GCP")
trafficMirrorGcp.command("new").action(gcpTrafficMirrorSetup)
trafficMirrorGcp.command("list").action(gcpTrafficMirrorList)
trafficMirrorGcp.command("remove").action(gcpTrafficMirrorDelete)
trafficMirrorGcp.command("cleanup").action(gcpTrafficMirrorCleanUp)

program.parseAsync()
