import { AxiosResponse } from "axios"
import { Context } from "../types/context"
import { ExtractorType } from "../types/enums"
import { Extractor } from "../types/test"
import { getKeyValue } from "./utils"
import { executeScript, stringReplacement } from "../utils"

export const runExtractor = (
  extractor: Extractor,
  response: AxiosResponse,
  ctx: Context,
): Context => {
  const extractorVal = stringReplacement(extractor.value, ctx.envVars)
  if (extractor.type == ExtractorType.enum.VALUE) {
    const keyValue = getKeyValue(extractorVal, response, ctx)
    ctx.envVars[extractor.name] = keyValue
  } else {
    ctx.envVars[extractor.name] = executeScript(extractorVal, response, ctx)
  }
  return ctx
}
