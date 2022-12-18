import { TestStep, TestResult } from "../types/test"
import { Context } from "../types/context"
import { makeRequest } from "./request"

export const runStep = async (
  idx: number,
  step: TestStep,
  nextSteps: TestStep[],
  ctx: Context,
): Promise<TestResult> => {
  // Make Request
  const res = await makeRequest(step.request, ctx)

  // Set Cookies
  const host = new URL(step.request.url).host
  const currUrlCookies = ctx.cookies.get(host) || new Map<string, string>()
  res.headers["set-cookie"]?.forEach(cookie => {
    const [name, value] = (cookie.split(";").at(-1) || "").split("=")
    if (name && value) {
      currUrlCookies.set(name, value)
    }
  })
  ctx.cookies.set(host, currUrlCookies)

  // Run Extractors
  // Add stuff to the contexts env

  // Run Assertions
  let assertions: boolean[] = []
  // Add Assertion results

  const stepResult = {
    idx,
    ctx,
    success: assertions.every(e => e),
    assertions,
    err: "",
  }

  const nextStep = nextSteps.shift()
  if (!nextStep) {
    return {
      success: stepResult.success,
      results: [[stepResult]],
    }
  }
  const nextRes = await runStep(idx + 1, nextStep, nextSteps, {
    envVars: new Map(ctx.envVars),
    cookies: new Map(
      Object.entries(ctx.cookies).map(([k, v]) => [k, new Map(v)]),
    ),
  })
  return {
    success: stepResult.success && nextRes.success,
    results: [[stepResult]].concat(nextRes.results),
  }
}
