import { JobName } from "./types"

interface JobMap {
  start: string
  end: string
  threshold: number
}

export const JOB_NAME_MAP: Record<JobName, JobMap> = {
  [JobName.GENERATE_OPENAPI_SPEC]: {
    start: "Generating OpenAPI Spec Files...",
    end: "Finished generating OpenAPI Spec Files",
    threshold: 1000 * 60 * 55,
  },
  [JobName.LOG_AGGREGATED_STATS]: {
    start: "Logging Aggregated Stats...",
    end: "Finished Logging Aggregated Stats",
    threshold: 300_000,
  },
  [JobName.FIX_ENDPOINTS]: {
    start: "Fixing endpoints...",
    end: "Finished Fixing endpoints",
    threshold: 1000 * 60 * 55,
  },
  [JobName.DETECT_SENSITIVE_DATA]: {
    start: "Detecting Sensitive Data...",
    end: "Finished Detecting Sensitive Data",
    threshold: 1000 * 60 * 14,
  },
  [JobName.DETECT_PRIVATE_HOSTS]: {
    start: "Detecting Private Hosts...",
    end: "Finished updating private hosts list ",
    threshold: 1000 * 60 * 55,
  },
  [JobName.UPDATE_HOURLY_TRACE_AGG]: {
    start: "Starting update of hourly endpoint calls",
    end: "Done updating of hourly endpoint calls",
    threshold: 1000 * 60 * 14,
  },
}
