import chalk from "chalk"
import ts, { ModuleKind } from "typescript"
import { Script, createContext } from "vm"
import * as MetloTesting from "@metlo/testing"

export const TEMPLATE_SAMPLE = `exports.default = {
    name: ...,
    version: ...,
    builder: ...,
}`

export const validateTemplateObj = (path: string, template: any): string => {
  if (!template.default) {
    return `${chalk.bold.red(
      `NO TEMPLATE EXPORTED IN "${path}". Export your template like this:\n\n`,
    )}${TEMPLATE_SAMPLE}`
  }
  template = template.default
  if (!(typeof template == "object") || Object.entries(template).length == 0) {
    return `${chalk.bold.red(
      `NO TEMPLATE EXPORTED IN "${path}". Export your template like this:\n\n`,
    )}${TEMPLATE_SAMPLE}`
  }
  if (typeof template.name != "string") {
    return chalk.bold.red(
      `INVALID TEMPLATE NAME. Expected a string recieved "${typeof template.name}".`,
    )
  }
  if (typeof template.version != "number") {
    return chalk.bold.red(
      `INVALID TEMPLATE VERSION. Expected a number recieved "${typeof template.version}".`,
    )
  }
  if (typeof template.builder != "function") {
    return chalk.bold.red(
      `INVALID TEMPLATE BUILDER. Expected a function recieved "${typeof template.version}".`,
    )
  }
  return ""
}

export const validateTemplateFileContents = (
  path: string,
  contents: string,
): string => {
  if (path.endsWith(".ts")) {
    contents = ts.transpile(contents, { module: ModuleKind.CommonJS })
  }

  const sandbox = {
    exports: {},
    testing: Object.entries(MetloTesting),
    require: function (moduleName) {
      if (moduleName === "@metlo/testing") {
        return MetloTesting
      }
      return require(moduleName)
    },
  }
  const context = createContext(sandbox)

  try {
    const script = new Script(contents)
    script.runInContext(context, { timeout: 1000 })
    const template = sandbox.exports
    return validateTemplateObj(path, template)
  } catch (err) {
    return `${err.message}\n${err.stack}`
  }
}
