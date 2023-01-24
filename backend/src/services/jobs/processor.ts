import mlog from "logger"
import { Job } from "bull"
import { AppDataSource } from "data-source"
import checkForUnauthenticatedEndpoints from "./check-unauthenticated-endpoints"
import clearApiTraces from "./clear-api-traces"
import { JOB_NAME_MAP } from "./constants"
import generateOpenApiSpec from "./generate-openapi-spec"
import monitorEndpointForHSTS from "./monitor-endpoint-hsts"
import fixEndpoints from "./fix-endpoints"
import detectSensitiveData from "./detect-sensitive-data"
import { JobName } from "./types"
import { wrapProcessor } from "./wrap-processor"
import { updateEndpointIps } from "analyze/jobs"
import { logAggregatedStats } from "services/logging"

const processor = async (job: Job, done) => {
  const ctx = {}
  if (!AppDataSource.isInitialized) {
    const datasource = await AppDataSource.initialize()
    if (!datasource.isInitialized) {
      mlog.error("Couldn't initialize datasource...")
      return Promise.resolve()
    }
    mlog.log("AppDataSource Initialized...")
  }

  mlog.info(JOB_NAME_MAP[job.name].start)
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
    case JobName.DETECT_SENSITIVE_DATA:
      await detectSensitiveData(ctx)
      break
    default:
      break
  }
  mlog.info(JOB_NAME_MAP[job.name].end, true)
  return Promise.resolve()
}
export default wrapProcessor(processor)
