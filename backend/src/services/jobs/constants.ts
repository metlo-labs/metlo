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
    threshold: 300_000,
  },
  [JobName.CHECK_UNAUTH_ENDPOINTS]: {
    start: "Checking for Unauthenticated Endpoint...",
    end: "Finished checking for Unauthenticated Endpoints",
    threshold: 300_000,
  },
  [JobName.MONITOR_ENDPOINT_HSTS]: {
    start: "Generating Alerts for Unsecured Endpoints...",
    end: "Finished generating alerts for Unsecured Endpoints",
    threshold: 300_000,
  },
  [JobName.CLEAR_API_TRACES]: {
    start: "Clearing Api Trace data...",
    end: "Finished clearing Api Trace data",
    threshold: 300_000,
  },
  [JobName.UPDATE_ENDPOINT_IPS]: {
    start: "Updating Endpoint IPs...",
    end: "Finished updating endpoint IPs",
    threshold: 300_000,
  },
  [JobName.LOG_AGGREGATED_STATS]: {
    start: "Logging Aggregated Stats...",
    end: "Finished Logging Aggregated Stats",
    threshold: 300_000,
  },
  [JobName.FIX_ENDPOINTS]: {
    start: "Fixing endpoints...",
    end: "Finished Fixing endpoints",
    threshold: 300_000,
  }
}
