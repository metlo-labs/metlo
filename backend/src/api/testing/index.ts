import { Router } from "express"
import { generateTestHandler } from "./generate-test"
import { getGenTestEndpointHandler } from "./get-gen-test-endpoint"

export default async function registerTestingRoutes(router: Router) {
  router.get("/api/v1/generate-test", generateTestHandler)
  router.get("/api/v1/gen-test-endpoint", getGenTestEndpointHandler)
}
