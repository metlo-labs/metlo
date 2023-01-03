import axios from "axios"
import { TestStep, TestResult, StepResult, StepResponse, StepRequest } from "../types/test"
import { Context } from "../types/context"
import { makeRequest } from "./request"
import { runAssertion } from "./assertions"
import { runExtractor } from "./extractors"
import { AxiosResponse } from "axios"

const axiosRespToStepResponse = (res: AxiosResponse): StepResponse => ({
  data: res.data,
  status: res.status,
  statusText: res.statusText,
  headers: Object.entries(res.headers).map(([key, val]) => {
    let strVal: string = ""
    if (Array.isArray(val)) {
      strVal = val.join(",")
    } else if (val) {
      strVal = val
    }
    return {
      name: key,
      value: strVal,
    }
  }),
})

export const runStep = async (
  idx: number,
  step: TestStep,
  nextSteps: TestStep[],
  ctx: Context,
): Promise<TestResult> => {
  let res: AxiosResponse | null = null
  let err: string | undefined = undefined
  let errStack: string | undefined = undefined

  const reqConfig = makeRequest(step.request, ctx)
  const stepRequest = {
    url: reqConfig.url,
    method: reqConfig.method,
    headers: reqConfig.headers,
    data: reqConfig.data,
  } as StepRequest

  try {
    res = await axios(reqConfig)
  } catch (e: any) {
    err = e.message
    errStack = e.stack
  }

  const host = new URL(step.request.url).host
  const currUrlCookies = ctx.cookies[host] || {}

  let stepResult: StepResult | null = null
  if (res !== null) {
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
      runAssertion(e, res as AxiosResponse, ctx),
    )

    stepResult = {
      idx,
      ctx,
      success: assertions.every(e => e),
      assertions,
      req: stepRequest,
      res: axiosRespToStepResponse(res),
    }
  } else {
    stepResult = {
      idx,
      ctx,
      success: false,
      assertions: [],
      err: err,
      req: stepRequest,
      errStack: errStack,
    }
  }

  const nextStep = nextSteps.shift()
  if (!nextStep) {
    return {
      success: stepResult.success,
      results: [[stepResult]],
    }
  }

  const cookiesCopy = Object.fromEntries(
    Object.entries(ctx.cookies).map(([key, value]) => [key, { ...value }]),
  )

  const nextRes = await runStep(idx + 1, nextStep, nextSteps, {
    envVars: { ...ctx.envVars },
    cookies: cookiesCopy,
  })
  return {
    success: stepResult.success && nextRes.success,
    results: [[stepResult]].concat(nextRes.results),
  }
}
