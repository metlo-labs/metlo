import { Router } from "express"
import { logRequestSingleHandler, logRequestBatchHandler } from "./log-request"
import {
  logRequestSingleHandler as logRequestSingleHandlerV2,
  logRequestBatchHandler as logRequestBatchHandlerV2,
} from "./log-request/v2"
import { validateCall } from "./validate"

export const registerLoggingRoutes = (router: Router) => {
  router.post("/log-request/single", logRequestSingleHandler)
  router.post("/log-request/batch", logRequestBatchHandler)
}

export const registerLoggingRoutesV2 = (router: Router) => {
  router.post("/log-request/single", logRequestSingleHandlerV2)
  router.post("/log-request/batch", logRequestBatchHandlerV2)
}

export function registerVerificationRoutes(router: Router) {
  router.get("/verify", validateCall)
}
