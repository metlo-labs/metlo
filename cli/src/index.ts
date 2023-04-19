#!/usr/bin/env node

import { Option, program } from "commander"
import init from "./init"
import { awsTrafficMirrorSetup } from "./aws/setup"
import { awsTrafficMirrorList } from "./aws/list"
import { awsTrafficMirrorRemove } from "./aws/remove"
import { gcpTrafficMirrorSetup } from "./gcp/setup"
import { gcpTrafficMirrorList } from "./gcp/list"
import { gcpTrafficMirrorDelete } from "./gcp/remove"
import { gcpTrafficMirrorCleanUp } from "./gcp/cleanup"
import { generateTest } from "./testing/generate"
import { runAuthTests, runTests } from "./testing/run"
import { pushTemplates } from "./testing/push-template"
import { initCustomTemplates } from "./testing/init-custom-templates"
import { mapOptionParser } from "./utils"
import { initJuiceShopData } from "./juice-shop/init-data"
import { initJuiceShopTemplates } from "./juice-shop/init-templates"
import { AWS_SOURCE_TYPE } from "./aws/types"

program.name("metlo").description("Metlo's command line tool.").version("0.2.9")

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
  .option("-x,--method <string>", "The method of the endpoint")
  .action(generateTest)
test
  .command("run")
  .argument("[paths...]", "Path to yaml test files")
  .option("-e,--endpoint <string>", "endpoint pattern or uuid")
  .option("-x,--method <string>", "The method of the endpoint")
  .option("-n,--host <string>", "hostname for which tests are to be")
  .option("-v,--verbose", "print detailed test errors")
  .option("--envfile <string>", "path for your env file")
  .option("--env <key>=<value>", "environment variables", mapOptionParser)
  .action(runTests)
test.command("run-auth-tests").action(runAuthTests)

const template = program.command("template")
template
  .command("init")
  .argument("<path>", "Path to project directory")
  .action(initCustomTemplates)
template
  .command("push")
  .argument("[paths...]", "Path to template files")
  .action(pushTemplates)

const trafficMirror = program
  .command("traffic-mirror")
  .description("Set up traffic mirroring for metlo")

const trafficMirrorAws = trafficMirror
  .command("aws")
  .description("Set up traffic mirroring for AWS")
trafficMirrorAws
  .command("new")
  .option("-i,--id <string>", "UUID for the identifier")
  .option(
    "-r,--region <string>",
    "AWS Region where source and target are located",
  )
  .option("-t,--target-eni-id <string>", "Target ENI ID")
  .option("-s,--source-id <string>", "Source entity ID")
  .option("-v,--variant <string>", "Type of Connection to make")
  .option(
    "--ecs-service-name <string>",
    "Name of ECS service to use. Must be used in conjunction with ECS variant",
  )
  .action(awsTrafficMirrorSetup)
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

const juiceShop = program.command("juice-shop")
juiceShop
  .command("init-data")
  .requiredOption("-h,--host <string>", "Juice Shop server host")
  .action(initJuiceShopData)
juiceShop.command("init-templates").action(initJuiceShopTemplates)

program.parseAsync()
