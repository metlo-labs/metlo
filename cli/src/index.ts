#!/usr/bin/env node

import { program } from "commander"
import { awsTrafficMirrorSetup } from "./aws/setup"
import { awsTrafficMirrorList } from "./aws/list"
import { awsTrafficMirrorRemove } from "./aws/remove"
import { gcpTrafficMirrorSetup } from "./gcp/setup"
import init from "./init"
import { gcpTrafficMirrorList } from "./gcp/list"
import { gcpTrafficMirrorDelete } from "./gcp/remove"
import { gcpTrafficMirrorCleanUp } from "./gcp/cleanup"
import { generateTest } from "./testing/generate"
import { runTestPath } from "@metlo/testing"

program.name("metlo").description("Metlo's command line tool.").version("0.1.1")

program
  .command("init")
  .description("Initialize the Metlo CLI.")
  .option("-b, --backend_url <string>", "The backend address for Metlo")
  .option("-k, --api_key <string>", "An API key for Metlo")
  .action(init)

const test = program
  .command("test")

test.command("generate")
  .option("-p,--path", "Path to generate the test at")
  .option("-t,--testType", "Type of test to generate")
  .option("-h,--host", "The host to generate this test for")
  .option("-e,--endpoint", "The endpoint to generate this test for")
  .action(generateTest);
test.command("run")
  .argument('<paths...>')
  .action(runTestPath);

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
trafficMirrorGcp.command("new").action(gcpTrafficMirrorSetup).option("-f,--force", "Force creation of new instance")
trafficMirrorGcp.command("list").action(gcpTrafficMirrorList)
trafficMirrorGcp.command("remove").action(gcpTrafficMirrorDelete)
trafficMirrorGcp.command("cleanup").action(gcpTrafficMirrorCleanUp)

program.parseAsync()
