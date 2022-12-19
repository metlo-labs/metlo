import { AxiosResponse } from "axios"
import { executeScript, stringReplacement } from "../utils"
import { Context } from "../types/context"
import { AssertionType } from "../types/enums"
import { Assertion } from "../types/test"
import { getKeyValue } from "./utils"

export const runAssertion = (
  assertion: Assertion,
  response: AxiosResponse,
  ctx: Context,
): boolean => {
  if (assertion.type == AssertionType.enum.JS) {
    if ((typeof assertion.val).toLowerCase() === "string") {
      const assertionKey = stringReplacement(assertion.val as string, ctx.envVars)
      if (executeScript(assertionKey, response, ctx)) {
        return true
      }
    } else {
      throw new Error(
        `Script must be of type string. Received script of type ${typeof assertion.val}`,
      )
    }
  }
  if (!assertion.key) {
    throw new Error("Must specify a key for assertion")
  }
  let assertionKey = undefined
  if (typeof (assertion.key).toLowerCase() == "string") {
    assertionKey = stringReplacement(assertion.key as string, ctx.envVars)
  } else {
    assertionKey = assertion.key
  }
  const assertionValue = getKeyValue(assertionKey, response, ctx)
  if (assertion.type == AssertionType.enum.EQ) {
    if (assertion.val instanceof Array) {
      assertion.val.some(e => e == assertionValue)
    } else {
      return assertionValue === assertion.val
    }
  } else if (assertion.type == AssertionType.enum.REGEXP) {
    const regex = new RegExp(assertion.val as string)
    return regex.test(assertionValue)
  }
  return false
}
