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
    ...ctx.envVars,
  }
  return get(data, key)
}

export function cartesian(takeProductOf: { [k: string]: Array<string> }) {
  const separatedKeys = Object.entries(takeProductOf).map(([key, entries]) => ({
    [key]: entries,
  }))
  function c(part: { [x: string]: string }, index: number) {
    var k = Object.keys(separatedKeys[index])[0]
    separatedKeys[index][k].forEach(function (a) {
      var p = Object.assign({}, part, { [k]: a })
      if (index + 1 === separatedKeys.length) {
        r.push(p)
        return
      }
      c(p, index + 1)
    })
  }

  let r: { [k: string]: string }[] = []
  c({}, 0)
  return r
}
