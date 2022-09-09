import { program } from "commander"
import init from "./init"
import testAPI from "./testAPI"

program.name("metlo").description("Metlo's command line tool.").version("0.0.0")

program
  .command("init")
  .description("Initialize the Metlo CLI.")
  .argument("-b, --backend_url <string>", "The backend address for Metlo")
  .action(init)
program
  .command("test")
  .description("Run Metlo API tests against a specified host.")
  .requiredOption("-h, --host <string>", "The production host in Metlo.")
  .requiredOption(
    "-t, --target <string>",
    "The host to run tests against against.",
  )
  .action(testAPI)

program.parseAsync()
