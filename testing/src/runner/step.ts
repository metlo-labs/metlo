import axios from "axios"
import {
  TestStep,
  TestResult,
  StepResult,
  StepResponse,
  StepRequest,
  Config,
} from "../types/test"
import { Context } from "../types/context"
import { makeRequest } from "./request"
import { runAssertion } from "./assertions"
import { runExtractor } from "./extractors"
import { AxiosResponse } from "axios"
import { AttackTypeArray } from "../types/enums"
import { getValues } from "../data"

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
  config: Config,
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

  const host = new URL(stepRequest.url).host
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
      runAssertion(e, res as AxiosResponse, ctx, config),
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

  const nextRes = await runStep(
    idx + 1,
    nextStep,
    nextSteps,
    {
      envVars: { ...ctx.envVars },
      cookies: cookiesCopy,
    },
    config,
  )
  return {
    success: stepResult.success && nextRes.success,
    results: [[stepResult]].concat(nextRes.results),
  }
}

export function runStepComplexity(
  idx: number,
  step: TestStep,
  nextSteps: TestStep[],
  ctx: Context,
  config: Config,
): number {
  if (step.payload) {
    const payloadValues: string[] = []
    step.payload.values.map(payload => {
      if (AttackTypeArray.includes(payload)) {
        payloadValues.push(...getValues(payload))
      } else {
        throw new Error("Invalid property for payload type")
      }
    })
    const results = payloadValues.map(e => {
      const key = step.payload?.key as string
      const newCtx = {
        ...ctx,
        envVars: { ...ctx.envVars, [key]: e },
      }
      return runStepComplexity(
        idx,
        {
          extract: step.extract,
          assert: step.assert,
          request: step.request,
        },
        nextSteps,
        newCtx,
        config,
      )
    })
    return results.reduce((prev, curr) => prev + curr, 0)
  } else {
    const next = nextSteps.shift()
    if (!next) {
      return 1
    }
    return 1 + runStepComplexity(idx + 1, next, nextSteps, ctx, config)
  }
}
