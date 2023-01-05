import { Job } from "bull"
import { DateTime } from "luxon"
import { AppDataSource } from "data-source"
import checkForUnauthenticatedEndpoints from "./check-unauthenticated-endpoints"
import clearApiTraces from "./clear-api-traces"
import { JOB_NAME_MAP } from "./constants"
import generateOpenApiSpec from "./generate-openapi-spec"
import monitorEndpointForHSTS from "./monitor-endpoint-hsts"
import fixEndpoints from "./fix-endpoints"
import { JobName } from "./types"
import { wrapProcessor } from "./wrap-processor"
import { updateEndpointIps } from "analyze/jobs"
import { logAggregatedStats } from "services/logging"

const log = (logMessage: string, newLine?: boolean) =>
  console.log(
    `${newLine ? "\n" : ""}${DateTime.utc().toString()} ${logMessage}`,
  )

const processor = async (job: Job, done) => {
  const ctx = {}
  if (!AppDataSource.isInitialized) {
    const datasource = await AppDataSource.initialize()
    if (!datasource.isInitialized) {
      console.error("Couldn't initialize datasource...")
      return Promise.resolve()
    }
    console.log("AppDataSource Initialized...")
  }

  log(JOB_NAME_MAP[job.name].start, true)
  switch (job.name) {
    case JobName.GENERATE_OPENAPI_SPEC:
      await generateOpenApiSpec(ctx)
      break
    case JobName.CHECK_UNAUTH_ENDPOINTS:
      await checkForUnauthenticatedEndpoints(ctx)
      break
    case JobName.MONITOR_ENDPOINT_HSTS:
      await monitorEndpointForHSTS(ctx)
      break
    case JobName.CLEAR_API_TRACES:
      await clearApiTraces(ctx)
      break
    case JobName.UPDATE_ENDPOINT_IPS:
      await updateEndpointIps(ctx)
      break
    case JobName.LOG_AGGREGATED_STATS:
      await logAggregatedStats(ctx)
      break
    case JobName.FIX_ENDPOINTS:
      await fixEndpoints(ctx)
      break
    default:
      break
  }
  log(JOB_NAME_MAP[job.name].end, true)
  return Promise.resolve()
}
export default wrapProcessor(processor)
