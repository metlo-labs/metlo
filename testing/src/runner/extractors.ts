import { AxiosResponse } from "axios"
import { Context } from "../types/context"
import { ExtractorType } from "../types/enums"
import { Extractor } from "../types/test"
import { getKeyValue } from "./utils"
import { executeScript } from "../utils"

export const runExtractor = (
  extractor: Extractor,
  response: AxiosResponse,
  ctx: Context,
): Context => {
  if (extractor.type == ExtractorType.enum.VALUE) {
    const keyValue = getKeyValue(extractor.val, response, ctx)
    ctx.envVars[extractor.name] = keyValue
  } else {
    ctx.envVars[extractor.name] = executeScript(extractor.val, response, ctx)
  }
  return ctx
}
