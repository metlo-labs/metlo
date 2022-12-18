import { AxiosResponse } from "axios"
import { Context } from "types/context"
import { Extractor } from "types/test"

export const runExtractor = (
  extractor: Extractor,
  response: AxiosResponse,
  ctx: Context,
): Context => {
  return ctx
}
