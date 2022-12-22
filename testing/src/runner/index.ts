import { TestConfig, TestResult, TestStep } from "../types/test"
import { runStep } from "./step"

export const runTest = async (test: TestConfig): Promise<TestResult> => {
  const context = {
    cookies: {},
    envVars: {},
  }
  if (test.env) {
    context.envVars = Object.fromEntries(test.env.map(e => [e.name, e.value]))
  }
  const testStack = [...test.test]
  if (testStack.length > 0) {
    const firstStep = testStack.shift() as TestStep
    const resp = await runStep(0, firstStep, testStack, context)
    return {
      test,
      success: resp.success,
      results: resp.results,
    }
  } else {
    throw new Error("No item to test in stack")
  }
}
