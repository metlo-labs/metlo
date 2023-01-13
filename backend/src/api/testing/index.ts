import { Router } from "express"
import { getGenTestEndpointHandler } from "./get-gen-test-endpoint"
import { getGlobalEnv } from "./env"

export default async function registerTestingRoutes(router: Router) {
  router.get("/api/v1/gen-test-endpoint", getGenTestEndpointHandler)
  router.get("/api/v1/testing/global-env", getGlobalEnv)
}
