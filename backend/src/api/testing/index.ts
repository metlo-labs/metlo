import { Router } from "express"
import { getGenTestEndpointHandler } from "./get-gen-test-endpoint"

export default async function registerTestingRoutes(router: Router) {
  router.get("/api/v1/gen-test-endpoint", getGenTestEndpointHandler)
}
