import { AxiosResponse } from "axios"
import { Context } from "types/context"
import vm2 from "vm2"
import * as Handlebars from "handlebars"
import jsdom from "jsdom"

const SCRIPT_DEFAULT_TIMEOUT = 1000

export const ALLOWED_DATA_TYPES = ["string", "bigint", "number", "boolean", "undefined", "null"]

export const processEnvVars = (base: string, envVars: Record<string, string>) => {
  for (let [key, value] of Object.entries(envVars)) {
    base = base.replace(`{{${key}}}`, value)
  }
  return base
}

const createVM = (resp: AxiosResponse, ctx: Context) => {
  const vm = new vm2.VM({ timeout: SCRIPT_DEFAULT_TIMEOUT, allowAsync: false, eval: false, wasm: false, })
  const sandboxItems = {}
  Object.entries(ctx.envVars).forEach(([k, v]) => vm.freeze(v, k))
  vm.freeze(resp, "resp")
  return vm
}

export const executeScript = (script: string, resp: AxiosResponse, ctx: Context) => {
  const vm = createVM(resp, ctx)
  const execResponse = vm.run(script)
  if (ALLOWED_DATA_TYPES.includes((typeof execResponse).toLowerCase())) {
    return execResponse
  } else {
    const errMsg = `Returned invalid type of response from JS code. Required one of ${ALLOWED_DATA_TYPES.join(",")},found ${typeof execResponse}`
    throw new Error(errMsg)
  }
}

export const extractFromHTML = (querySelectorKey: string, resp: AxiosResponse, ctx: Context) => {
  const vm = createVM(resp, ctx)
  vm.freeze(jsdom.JSDOM.fragment, "jsdom")
  const dom = jsdom.JSDOM.fragment(resp.data)

  vm.freeze(resp.data, "body")
  const execResponse = vm.run(`
    const dom = jsdom(body);
    dom.querySelector("${querySelectorKey}")
  `)
  return execResponse
}

export const extractRegexp = (querySelectorKey: string, resp: AxiosResponse, ctx: Context) => {
  const vm = createVM(resp, ctx)
  vm.freeze(jsdom.JSDOM.fragment, "jsdom")
  const dom = jsdom.JSDOM.fragment(resp.data)

  vm.freeze(resp.data, "body")
  const execResponse = vm.run(`
    const dom = jsdom(body);
    dom.querySelector("${querySelectorKey}")
  `)
  return execResponse
}

export const stringReplacement = (string: string, envVars: Context["envVars"]) => {
  const template = Handlebars.compile(string);
  const templated = (template(envVars));
  return templated
}