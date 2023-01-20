import axios from "axios"
import {
  TestStep,
  TestResult,
  StepResult,
  StepResponse,
  StepRequest,
  Config,
  PayloadType,
} from "../types/test"
import { Context } from "../types/context"
import { makeRequest } from "./request"
import { runAssertion } from "./assertions"
import { runExtractor } from "./extractors"
import { AxiosResponse } from "axios"
import { PredefinedPayloadTypeArray } from "../types/enums"
import { getValues } from "../data"
import { cartesian } from "./utils"

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

const runStepPayloads = async (
  idx: number,
  step: TestStep,
  nextSteps: TestStep[],
  ctx: Context,
  config: Config,
): Promise<TestResult> => {
  const payloadValues: { [key: string]: string[] } = {}
  step.payload = step.payload as PayloadType
  step.payload.forEach(payloadEntry => {
    const payload = payloadEntry.value
    if (payloadEntry.key in payloadValues) {
      payloadValues[payloadEntry.key].push(...getValues(payload))
    } else {
      payloadValues[payloadEntry.key] = [...getValues(payload)]
    }
  })

  const results = await Promise.all(
    cartesian(payloadValues).map(data => {
      const newCtx = {
        ...ctx,
        envVars: { ...ctx.envVars, ...data },
      }
      return runStep(
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
    }),
  )
  const flatResults = results.map(e => e.results.flat()).flat()
  const groupedResults = {} as Record<number, StepResult[]>
  flatResults.forEach(res => {
    if (res.idx in groupedResults) {
      groupedResults[res.idx].push(res)
    } else {
      groupedResults[res.idx] = [res]
    }
  })
  const combinedResults = Object.entries(groupedResults)
    .sort(([key1, res1], [key2, res2]) => (key1 < key2 ? 1 : -1))
    .map(([key, res]) => res)
  return {
    success: results.every(e => e),
    results: combinedResults,
  }
}

export const runStep = async (
  idx: number,
  step: TestStep,
  nextSteps: TestStep[],
  ctx: Context,
  config: Config,
): Promise<TestResult> => {
  if (step.payload) {
    return runStepPayloads(idx, step, nextSteps, ctx, config)
  }

  let res: AxiosResponse | null = null
  let err: string | undefined = undefined
  let errStack: string | undefined = undefined
  let abortedAt: number | undefined = undefined

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
    let assertions: boolean[] = Array((step.assert || []).length).fill(false)
    for (const e of step.extract || []) {
      ctx = runExtractor(e, res, ctx)
    }
    let i = 0
    for (const _step of step.assert || []) {
      const asserted = runAssertion(_step, res as AxiosResponse, ctx)
      assertions[i] = asserted
      i++
      if (config.stopOnFailedAssertion && !asserted) {
        abortedAt = i
        break
      }
    }
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
  if (!nextStep || abortedAt) {
    return {
      success: stepResult.success,
      results: [[stepResult]],
      abortedAt,
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
    abortedAt: nextRes.abortedAt,
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
    const payloadValues: { [key: string]: string[] } = {}
    step.payload.forEach(payloadEntry => {
      const payload = payloadEntry.value
      if (payloadEntry.key in payloadValues) {
        payloadValues[payloadEntry.key].push(...getValues(payload))
      } else {
        payloadValues[payloadEntry.key] = [...getValues(payload)]
      }
    })
    const results = cartesian(payloadValues).map(data => {
      const newCtx = {
        ...ctx,
        envVars: { ...ctx.envVars, ...data },
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
