import schedule from "node-schedule"
import semaphore from "semaphore"
import { AppDataSource } from "data-source"
import { JobsService } from "services/jobs"
import runAllTests from "services/testing/runAllTests"
import { logAggregatedStats } from "services/logging"

const main = async () => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...")
    return
  }
  console.log("AppDataSource Initialized...")

  const analyzeTracesSem = semaphore(1)
  const generateEndpointsSem = semaphore(1)
  const unsecuredAlertsSem = semaphore(1)
  const testsSem = semaphore(1)
  const clearApiTracesSem = semaphore(1)
  const logAggregateStatsSem = semaphore(1)

  schedule.scheduleJob("* * * * * *", () => {
    analyzeTracesSem.take(async () => {
      console.log("\nAnalyzing traces...")
      await JobsService.analyzeTraces()
      console.log("Finished analyzing traces.")
      analyzeTracesSem.leave()
    })
  })

  schedule.scheduleJob("*/30 * * * * *", () => {
    generateEndpointsSem.take(async () => {
      console.log("\nGenerating Endpoints and OpenAPI Spec Files...")
      await JobsService.generateEndpointsFromTraces()
      console.log("Finished generating Endpoints and OpenAPI Spec Files.")
      generateEndpointsSem.leave()
    })
  })

  // Offset by 15 minutes past every 4th hour, so that there isn't any excess database slowdown
  schedule.scheduleJob("15 */4 * * *", () => {
    unsecuredAlertsSem.take(async () => {
      console.log("\nGenerating Alerts for Unsecured Endpoints")
      await JobsService.monitorEndpointForHSTS()
      console.log("Finished generating alerts for Unsecured Endpoints.")
      unsecuredAlertsSem.leave()
    })
  })

  schedule.scheduleJob("30 * * * *", () => {
    testsSem.take(async () => {
      console.log("\nRunning Tests...")
      await runAllTests()
      console.log("Finished running tests.")
      testsSem.leave()
    })
  })

  schedule.scheduleJob("0 * * * *", () => {
    clearApiTracesSem.take(async () => {
      console.log("\nClearing Api Trace data...")
      await JobsService.clearApiTraces()
      console.log("Finished clearing Api Trace data.")
      clearApiTracesSem.leave()
    })
  })

  if ((process.env.DISABLE_LOGGING_STATS || "false").toLowerCase() == "false") {
    schedule.scheduleJob("0 */6 * * *", () => {
      logAggregateStatsSem.take(async () => {
        console.log("\nLogging Aggregated Stats...")
        await logAggregatedStats()
        console.log("Finished Logging Aggregated Stats.")
        logAggregateStatsSem.leave()
      })
    })
  } else {
    console.log("\nLogging Aggregated Stats Disabled...")
  }

  process.on("SIGINT", () => {
    schedule.gracefulShutdown().then(() => process.exit(0))
  })
}

main()
