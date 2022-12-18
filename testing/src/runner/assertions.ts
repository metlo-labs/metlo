import { AxiosResponse } from "axios"
import { Context } from "types/context"
import { Assertion } from "types/test"

export const runAssertion = (
  assertion: Assertion,
  response: AxiosResponse,
  ctx: Context,
): boolean => {
  return true
}
