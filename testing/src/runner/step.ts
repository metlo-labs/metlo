import { TestStep, TestResult } from "../types/test"
import { Context } from "../types/context"
import { makeRequest } from "./request"
import { runAssertion } from "./assertions"
import { runExtractor } from "./extractors"

export const runStep = async (
  idx: number,
  step: TestStep,
  nextSteps: TestStep[],
  ctx: Context,
): Promise<TestResult> => {
  const res = await makeRequest(step.request, ctx)
  const host = new URL(step.request.url).host
  const currUrlCookies = ctx.cookies[host] || {}
  res.headers["set-cookie"]?.forEach(cookie => {
    const [name, value] = (cookie.split(";").at(-1) || "").split("=")
    if (name && value) {
      currUrlCookies[name] = value
    }
  })
  ctx.cookies[host] = currUrlCookies

  for (const e of step.extract || []) {
    ctx = runExtractor(e, res, ctx)
  }
  let assertions: boolean[] = (step.assert || []).map(e =>
    runAssertion(e, res, ctx),
  )

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

  const cookiesCopy = Object.entries(ctx.cookies).map(
    ([key, value]) => ({ key: { ...value } })
  )

  const nextRes = await runStep(idx + 1, nextStep, nextSteps, {
    envVars: { ...ctx.envVars },
    cookies: {},
  },
  )
  return {
    success: stepResult.success && nextRes.success,
    results: [[stepResult]].concat(nextRes.results),
  }
}
