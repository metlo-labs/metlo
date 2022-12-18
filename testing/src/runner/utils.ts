import { AxiosResponse } from "axios"
import get from "lodash.get"
import { Context } from "../types/context"

export const getKeyValue = (
  key: string,
  resp: AxiosResponse,
  ctx: Context,
): any => {
  const data = {
    status: resp.status,
    resp,
    ctx,
    ...ctx.envVars
  }
  return get(data, key)
}
