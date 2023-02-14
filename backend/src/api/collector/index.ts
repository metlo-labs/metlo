import { Router } from "express"
import {
  logRequestSingleHandler,
  logRequestBatchHandler,
  logRequestSingleHandlerV2,
} from "./log-request"
import { validateCall } from "./validate"

export const registerLoggingRoutes = (router: Router) => {
  router.post("/log-request/single", logRequestSingleHandler)
  router.post("/log-request/batch", logRequestBatchHandler)
}

export const registerLoggingRoutesV2 = (router: Router) => {
  router.post("/log-request/single", logRequestSingleHandlerV2)
}

export function registerVerificationRoutes(router: Router) {
  router.get("/verify", validateCall)
}
