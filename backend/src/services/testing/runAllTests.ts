import { AppDataSource } from "data-source"
import { ApiEndpointTest } from "models"
import { runTest } from "@metlo/testing"

export const runAllTests = async (): Promise<void> => {
  const testRepository = AppDataSource.getRepository(ApiEndpointTest)
  const allTests = await testRepository.find({
    relations: {
      apiEndpoint: true,
    },
  })
  const results = await Promise.all(
    allTests.map(t => {
      let envVars = new Map<string, string>()
      envVars.set("baseUrl", `https://${t.apiEndpoint.host}`)
      return runTest(t, envVars)
    }),
  )
  await Promise.all(
    allTests.map((test, testIdx) => {
      const runResult = results[testIdx]
      test.requests = test.requests.map((e, i) => ({
        ...e,
        result: runResult[i],
      }))
      return testRepository.save(test)
    }),
  )
}

export default runAllTests
