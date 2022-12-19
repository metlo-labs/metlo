import { AxiosResponse } from "axios"
import { executeScript } from "../utils"
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
      if (executeScript(assertion.val as string, response, ctx)) {
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
  const assertionValue = getKeyValue(assertion.key, response, ctx)
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
