import { AxiosResponse } from "axios"
import { Context } from "types/context"
import ivm from "isolated-vm"
import * as Handlebars from "handlebars"
import jsdom from "jsdom"

const SCRIPT_DEFAULT_TIMEOUT = 1000

export const ALLOWED_DATA_TYPES = [
  "string",
  "bigint",
  "number",
  "boolean",
  "undefined",
  "null",
]

export const processEnvVars = (
  base: string,
  envVars: Record<string, string>,
) => {
  for (let [key, value] of Object.entries(envVars)) {
    base = base.replace(`{{${key}}}`, value)
  }
  return base
}

const removeNonPrimitives = (obj: any) => {
  if (typeof obj !== "object") {
    return
  }
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === "object") {
        removeNonPrimitives(obj[key])
      } else if (Array.isArray(obj[key])) {
        for (let i = 0; i < obj[key].length; i++) {
          removeNonPrimitives(obj[key][i])
        }
      } else if (!ALLOWED_DATA_TYPES.includes(typeof obj[key])) {
        delete obj[key]
      }
    }
  }
}

const createIsolate = (resp: AxiosResponse, ctx: Context) => {
  const isolate = new ivm.Isolate({ memoryLimit: 128 })
  const context = isolate.createContextSync()

  let jail = context.global
  jail.setSync("global", jail.derefInto())

  Object.entries(ctx.envVars).forEach(([k, v]) => {
    jail.setSync(k, new ivm.ExternalCopy(v).copyInto())
  })

  const { data, status, statusText, headers, config } = resp
  const simplifiedResp = { data, status, statusText, headers: headers, config }
  removeNonPrimitives(simplifiedResp)
  jail.setSync("resp", new ivm.ExternalCopy(simplifiedResp).copyInto())
  return { context, isolate }
}

export const executeScript = (
  script: string,
  resp: AxiosResponse,
  ctx: Context,
) => {
  const { context, isolate } = createIsolate(resp, ctx)
  const scriptObj = isolate.compileScriptSync(script)
  const execResponse = scriptObj.runSync(context, {
    timeout: SCRIPT_DEFAULT_TIMEOUT,
  })

  if (ALLOWED_DATA_TYPES.includes((typeof execResponse).toLowerCase())) {
    return execResponse
  } else {
    const errMsg = `Returned invalid type of response from JS code. Required one of ${ALLOWED_DATA_TYPES.join(
      ",",
    )},found ${typeof execResponse}`
    throw new Error(errMsg)
  }
}

export const extractFromHTML = (
  querySelectorKey: string,
  resp: AxiosResponse,
  ctx: Context,
) => {
  const { context, isolate } = createIsolate(resp, ctx)
  const jail = context.global
  jail.setSync("global", jail.derefInto())
  jail.setSync("body", new ivm.ExternalCopy(resp.data).copyInto())
  jail.setSync("parseHTML", function (html: string, selector: string) {
    const dom = jsdom.JSDOM.fragment(html)
    return dom.querySelector(selector)?.innerHTML
  })
  const script = `
    parseHTML(body, "${querySelectorKey}");
  `
  const scriptObj = isolate.compileScriptSync(script)
  return scriptObj.runSync(context, { timeout: SCRIPT_DEFAULT_TIMEOUT })
}

export const extractRegexp = (
  regexp: string,
  resp: AxiosResponse,
  ctx: Context,
) => {
  let strData = ""
  if (typeof resp.data == "string") {
    strData = resp.data
  }
  if (typeof resp.data == "object") {
    strData = JSON.stringify(resp.data)
  }
  const match = strData.match(new RegExp(regexp))
  if (match) {
    return match[0]
  }
  return ""
}

export const stringReplacement = (
  string: string,
  envVars: Context["envVars"],
) => {
  const template = Handlebars.compile(string, { noEscape: true })
  const templated = template(envVars)
  return templated
}
