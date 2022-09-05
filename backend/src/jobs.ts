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

  schedule.scheduleJob("0 * * * *", () => {
    console.log("Generating Endpoints and OpenAPI Spec Files...")
    JobsService.generateEndpointsFromTraces()
    console.log("Finished generating Endpoints and OpenAPI Spec Files.")
  })

  // Offset by 15 minutes past every 4th hour, so that there isn't any excess database slowdown
  schedule.scheduleJob("15 */4 * * *", () => {
    console.log("Generating Endpoints and OpenAPI Spec Files...")
    JobsService.monitorEndpointForHSTS()
    console.log("Finished generating Endpoints and OpenAPI Spec Files.")
  })

  schedule.scheduleJob("30 * * * *", () => {
    console.log("Running Tests...")
    runAllTests()
  })

  process.on("SIGINT", () => {
    schedule.gracefulShutdown().then(() => process.exit(0))
  })
}

main()
