import { AxiosResponse } from "axios"
import { executeScript, stringReplacement } from "../utils"
import { Context } from "../types/context"
import { AssertionType } from "../types/enums"
import { Assertion, Config } from "../types/test"
import { getKeyValue } from "./utils"
import chalk from "chalk"

export const runAssertion = (
  assertion: Assertion,
  response: AxiosResponse,
  ctx: Context,
  config: Config,
): boolean => {
  let assertionTruth = false
  if (typeof assertion == "string") {
    assertion = {
      type: AssertionType.enum.JS,
      value: assertion,
    }
  }

  if (assertion.type == AssertionType.enum.JS) {
    if ((typeof assertion.value).toLowerCase() === "string") {
      const assertionValue = stringReplacement(
        assertion.value as string,
        ctx.envVars,
      )
      assertionTruth = !!executeScript(assertionValue, response, ctx)
    } else {
      throw new Error(
        `Script must be of type string. Received script of type ${typeof assertion.value}`,
      )
    }
  } else if (
    assertion.type == AssertionType.enum.EQ ||
    assertion.type == AssertionType.enum.REGEXP
  ) {
    if (!assertion.key) {
      throw new Error("Must specify a key for assertion")
    }
    let assertionKey = undefined
    let assertionValue = undefined
    if ((typeof assertion.key).toLowerCase() == "string") {
      assertionKey = stringReplacement(assertion.key as string, ctx.envVars)
    } else {
      assertionKey = assertion.key
    }
    if ((typeof assertion.value).toLowerCase() == "string") {
      assertionValue = stringReplacement(assertion.value as string, ctx.envVars)
    } else {
      assertionValue = assertion.value
    }
    const currentValue = getKeyValue(assertionKey, response, ctx)
    if (assertion.type == AssertionType.enum.EQ) {
      if (assertionValue instanceof Array) {
        assertionTruth = assertionValue.some(e => e == currentValue)
      } else {
        assertionTruth = assertionValue === currentValue
      }
    } else if (assertion.type == AssertionType.enum.REGEXP) {
      const regex = new RegExp(assertionValue as string)
      assertionTruth = regex.test(currentValue)
    }
  }
  if (config && config.stopOnFailedAssertion) {
    console.log(chalk.redBright.bold(`Failed assertion: ${assertion.value}`))
    process.exit()
  }
  return assertionTruth
}
