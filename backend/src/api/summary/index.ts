import { Router } from "express"
import { getEndpointTrackedHandler } from "./endpoints"
import { getSensitiveDataSummaryHandler } from "./sensitive-data"
import { getSummaryHandler } from "./summary"
import { getVulnerabilitySummaryHandler } from "./vulnerability"

export default function registerSummaryRoutes(router: Router) {
  router.get("/api/v1/summary", getSummaryHandler)
  router.get("/api/v1/summary/endpoint-tracked", getEndpointTrackedHandler)
  router.get("/api/v1/sensitive-data-summary", getSensitiveDataSummaryHandler)
  router.get("/api/v1/vulnerability-summary", getVulnerabilitySummaryHandler)
}
