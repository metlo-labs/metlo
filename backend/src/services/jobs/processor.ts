import mlog from "logger"
import { Job } from "bull"
import { AppDataSource } from "data-source"
import checkForUnauthenticatedEndpoints from "./check-unauthenticated-endpoints"
import clearApiTraces from "./clear-api-traces"
import { JOB_NAME_MAP } from "./constants"
import generateOpenApiSpec from "./generate-openapi-spec"
import fixEndpoints from "./fix-endpoints"
import detectSensitiveData from "./detect-sensitive-data"
import { JobName } from "./types"
import { wrapProcessor } from "./wrap-processor"
import { logAggregatedStats } from "services/logging"
import { detectPrivateHosts } from "./detect-private-hosts"

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
  let success = true
  const jobStartTime = performance.now()
  switch (job.name) {
    case JobName.GENERATE_OPENAPI_SPEC:
      success = await generateOpenApiSpec(ctx)
      break
    case JobName.CHECK_UNAUTH_ENDPOINTS:
      success = await checkForUnauthenticatedEndpoints(ctx)
      break
    case JobName.CLEAR_API_TRACES:
      success = await clearApiTraces(ctx)
      break
    case JobName.LOG_AGGREGATED_STATS:
      success = await logAggregatedStats(ctx)
      break
    case JobName.FIX_ENDPOINTS:
      success = await fixEndpoints(ctx)
      break
    case JobName.DETECT_SENSITIVE_DATA:
      success = await detectSensitiveData(ctx)
      break
    case JobName.DETECT_PRIVATE_HOSTS:
      success = await detectPrivateHosts(ctx)
      break
    default:
      break
  }
  mlog.time(`jobrunner.${job.name}`, performance.now() - jobStartTime)
  mlog.count(`jobrunner.${job.name}.run_count`)
  if (!success) {
    mlog.count(`jobrunner.${job.name}.error_count`)
  }
  mlog.info(JOB_NAME_MAP[job.name].end)
  return Promise.resolve()
}
export default wrapProcessor(processor)
