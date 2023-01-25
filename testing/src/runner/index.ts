import { TestOptions, TestConfig, TestResult, TestStep } from "../types/test"
import { runStep, runStepComplexity } from "./step"
import * as Handlebars from "handlebars"

Handlebars.registerHelper("default", (value, defaultValue) => {
  let out = value || defaultValue
  return new Handlebars.SafeString(out)
})

export const estimateTest = (
  test: TestConfig,
  env?: Record<string, string | object>,
): number => {
  const context = {
    cookies: {},
    envVars: env || {},
  }
  if (test.env) {
    context.envVars = Object.fromEntries(
      Object.entries(context.envVars).concat(
        test.env.map(e => [e.name, e.value]),
      ),
    )
  }
  const testStack = [...test.test]
  if (testStack.length > 0) {
    const firstStep = testStack.shift() as TestStep
    const config = test.options as TestOptions
    return runStepComplexity(0, firstStep, testStack, context, config)
  } else {
    throw new Error("No item to test in stack")
  }
}

export const runTest = async (
  test: TestConfig,
  env?: Record<string, string | object>,
): Promise<TestResult> => {
  const context = {
    cookies: {},
    envVars: env || {},
  }

  if (test.env) {
    let currentEnv = { ...env }
    test.env.forEach(
      e => (currentEnv[e.name] = Handlebars.compile(e.value)(currentEnv)),
    )
    context.envVars = currentEnv
  }
  const testStack = [...test.test]
  if (testStack.length > 0) {
    const firstStep = testStack.shift() as TestStep
    const config = test.options || {}
    const resp = await runStep(0, firstStep, testStack, context, config)
    return {
      test,
      success: resp.success,
      results: resp.results,
      abortedAt: resp.abortedAt,
    }
  } else {
    throw new Error("No item to test in stack")
  }
}
