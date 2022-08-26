import { AppDataSource } from "data-source"
import { ApiEndpointTest } from "models"
import { runTest } from "./runTests"

export const runAllTests = async (): Promise<void> => {
  const testRepository = AppDataSource.getRepository(ApiEndpointTest)
  const allTests = await testRepository.find()
  const results = await Promise.all(allTests.map(runTest))
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
