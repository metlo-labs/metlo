import { TestConfig, TestResult, TestStep } from "../types/test"
import { runStep } from "./step"
import * as Handlebars from "handlebars"

export const runTest = async (
  test: TestConfig,
  env?: Record<string, string>,
): Promise<TestResult> => {
  const context = {
    cookies: {},
    envVars: env || {},
  }

  if (test.env) {
    context.envVars = Object.fromEntries(
      Object.entries(context.envVars).concat(
        test.env.map(e => [e.name, Handlebars.compile(e.value)(env)]),
      ),
    )
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
