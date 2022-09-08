import schedule from "node-schedule"
import { AppDataSource } from "data-source"
import { JobsService } from "services/jobs"
import runAllTests from "services/testing/runAllTests"

const main = async () => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...")
    return
  }
  console.log("AppDataSource Initialized...")

  schedule.scheduleJob("*/20 * * * *", async () => {
    console.log("Generating Endpoints and OpenAPI Spec Files...")
    await JobsService.generateEndpointsFromTraces()
    console.log("Finished generating Endpoints and OpenAPI Spec Files.")
  })

  // Offset by 15 minutes past every 4th hour, so that there isn't any excess database slowdown
  schedule.scheduleJob("15 */4 * * *", async () => {
    console.log("Generating Alerts for Unsecured Endpoints")
    await JobsService.monitorEndpointForHSTS()
    console.log("Finished generating alerts for Unsecured Endpoints.")
  })

  schedule.scheduleJob("30 * * * *", async () => {
    console.log("Running Tests...")
    await runAllTests()
    console.log("Finished running tests.")
  })

  schedule.scheduleJob("0 * * * *", async () => {
    console.log("Clearing Api Trace data...")
    await JobsService.clearApiTraces()
    console.log("Finished clearing Api Trace data.")
  })

  process.on("SIGINT", () => {
    schedule.gracefulShutdown().then(() => process.exit(0))
  })
}

main()
