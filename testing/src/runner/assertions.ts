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
  let assertionValue = getKeyValue(assertion.key, response, ctx)
  if (assertion.type == AssertionType.enum.EQ) {
    if (assertion.val instanceof Array) {
      if (!(assertionValue instanceof Array)) {
        return false
      }
      return assertion.val.every((v, i) => assertionValue[i] == v)
    } else if (assertionValue == assertion.val) {
      return assertionValue === assertion.val
    }
  } else if (assertion.type == AssertionType.enum.REGEXP) {
    const regex = new RegExp(assertion.val as string)
    return regex.test(assertionValue)
  } else {
    if ((typeof assertion.val).toLowerCase() === "string") {
      if (
        assertionValue === executeScript(assertion.val as string, response, ctx)
      )
        return true
    } else {
      throw new Error(
        `Script must be of type string. Received script of type ${typeof assertion.val}`,
      )
    }
    return false
  }
  return false
}
