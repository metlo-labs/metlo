import * as Handlebars from "handlebars"
import { TestConfig, TestStep } from "../types/test"
import { Context } from "../types/context"
import { makeRequest } from "../runner/request"
import { ExportTestType } from "./enums"

const getCurlStepExport = (step: TestStep, context: Context) => {
  const reqConfig = makeRequest(step.request, context)
  if (!reqConfig.url) {
    throw new Error("No URL defined for test.")
  }
  if (!reqConfig.method) {
    throw new Error("No method defined for test.")
  }
  let cmd = `curl -X ${reqConfig.method} ${reqConfig.url}`
  if (reqConfig.headers) {
    for (const header in reqConfig.headers) {
      if (header !== "undefined") {
        cmd += ` -H "${header}: ${reqConfig.headers[header]}"`
      }
    }
  }
  if (reqConfig.data) {
    cmd += ` -d '${reqConfig.data}'`
  }
  return cmd
}

const getHttpStepExport = (step: TestStep, context: Context) => {
  const reqConfig = makeRequest(step.request, context)
  if (!reqConfig.url) {
    throw new Error("No URL defined for test.")
  }
  if (!reqConfig.method) {
    throw new Error("No method defined for test.")
  }
  const url = new URL(reqConfig.url)
  const path = url.pathname
  const host = url.hostname

  let res = `${reqConfig.method} ${path} HTTP/1.1`
  if (reqConfig.headers) {
    if (!reqConfig.headers["host"] || !reqConfig.headers["Host"]) {
      res += `\nHost: ${host}`
    }
    for (const header in reqConfig.headers) {
      if (header !== "undefined") {
        res += `\n${header}: ${reqConfig.headers[header]}`
      }
    }
  }
  if (reqConfig.data) {
    res += `\n\n${reqConfig.data}`
  }
  return res
}

const getStepRes = (step: TestStep, context: Context, exportType: string) => {
  switch (exportType) {
    case ExportTestType.CURL:
      return getCurlStepExport(step, context)
    case ExportTestType.HTTP:
      return getHttpStepExport(step, context)
    default:
      return "Invalid Export Type"
  }
}

export const getExportedTestSteps = (
  test: TestConfig,
  exportType: string,
  env?: Record<string, string | object>,
) => {
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
  const resp: string[] = []
  for (let i = 0; i < testStack.length; i++) {
    const step = testStack[i] as TestStep
    if (step.payload) {
      throw new Error("Cannot export for tests with payload option.")
    }
    const stepRes = getStepRes(step, context, exportType)
    resp.push(stepRes)
  }
  return resp
}
