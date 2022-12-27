import chalk from "chalk"

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
