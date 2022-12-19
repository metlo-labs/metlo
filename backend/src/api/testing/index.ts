import { Router } from "express"
import { generateTestHandler } from "./generate-test"

export default async function registerTestingRoutes(router: Router) {
  router.get("/api/v1/generate-test", generateTestHandler)
}
