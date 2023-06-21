import { Router } from "express"
import {
  getGenTestEndpointHandler,
  getGenTestEndpointsHandler,
} from "./get-gen-test-endpoint"
import { getGlobalEnv } from "./env"

export default async function registerTestingRoutes(router: Router) {
  router.get("/api/v1/gen-test-endpoint", getGenTestEndpointHandler)
  router.get("/api/v1/testing/global-env", getGlobalEnv)
  router.get("/api/v1/gen-test-endpoints", getGenTestEndpointsHandler)
}
