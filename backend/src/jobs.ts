import schedule from "node-schedule"
import semaphore from "semaphore"
import { AppDataSource } from "data-source"
import {
  checkForUnauthenticatedEndpoints,
  monitorEndpointForHSTS,
  clearApiTraces,
  generateOpenApiSpec,
} from "services/jobs"
import runAllTests from "services/testing/runAllTests"
import { logAggregatedStats } from "services/logging"
import { DateTime } from "luxon"

const log = (logMessage: string, newLine?: boolean) =>
  console.log(
    `${newLine ? "\n" : ""}${DateTime.utc().toString()} ${logMessage}`,
  )

const main = async () => {
  const datasource = await AppDataSource.initialize()
  if (!datasource.isInitialized) {
    console.error("Couldn't initialize datasource...")
    return
  }
  console.log("AppDataSource Initialized...")

  const generateSpecSem = semaphore(1)
  const unsecuredAlertsSem = semaphore(1)
  const testsSem = semaphore(1)
  const clearApiTracesSem = semaphore(1)
  const logAggregateStatsSem = semaphore(1)
  const checkForUnauthenticatedSem = semaphore(1)

  schedule.scheduleJob("*/10 * * * *", () => {
    generateSpecSem.take(async () => {
      log("Generating OpenAPI Spec Files...", true)
      await generateOpenApiSpec()
      log("Finished generating OpenAPI Spec Files.")
      generateSpecSem.leave()
    })
  })

  schedule.scheduleJob("30 * * * * ", () => {
    checkForUnauthenticatedSem.take(async () => {
      log("Checking for Unauthenticated Endpoints", true)
      await checkForUnauthenticatedEndpoints()
      log("Finished checking for Unauthenticated Endpoints")
      checkForUnauthenticatedSem.leave()
    })
  })

  // Offset by 15 minutes past every 4th hour, so that there isn't any excess database slowdown
  schedule.scheduleJob("15 * * * *", () => {
    unsecuredAlertsSem.take(async () => {
      log("Generating Alerts for Unsecured Endpoints", true)
      await monitorEndpointForHSTS()
      log("Finished generating alerts for Unsecured Endpoints.")
      unsecuredAlertsSem.leave()
    })
  })

  schedule.scheduleJob("30 * * * *", () => {
    testsSem.take(async () => {
      log("Running Tests...", true)
      await runAllTests()
      log("Finished running tests.")
      testsSem.leave()
    })
  })

  schedule.scheduleJob("*/10 * * * *", () => {
    clearApiTracesSem.take(async () => {
      log("Clearing Api Trace data...", true)
      await clearApiTraces()
      log("Finished clearing Api Trace data.")
      clearApiTracesSem.leave()
    })
  })

  if ((process.env.DISABLE_LOGGING_STATS || "false").toLowerCase() == "false") {
    schedule.scheduleJob("0 */6 * * *", () => {
      logAggregateStatsSem.take(async () => {
        log("Logging Aggregated Stats...", true)
        await logAggregatedStats()
        log("Finished Logging Aggregated Stats.")
        logAggregateStatsSem.leave()
      })
    })
  } else {
    log("Logging Aggregated Stats Disabled...", true)
  }

  process.on("SIGINT", () => {
    schedule.gracefulShutdown().then(() => process.exit(0))
  })
}

main()
