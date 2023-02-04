import { Router } from "express"
import { logRequestSingleHandler, logRequestBatchHandler } from "./log-request"
import { validateCall } from "./validate"

export default function registerLoggingRoutes(router: Router) {
  router.post("/log-request/single", logRequestSingleHandler)
  router.post("/log-request/batch", logRequestBatchHandler)
}

export function registerVerificationRoutes(router: Router) {
  router.get("/verify", validateCall)
}
