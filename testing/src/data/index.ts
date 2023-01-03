import { AttackType, AttackTypeArray } from "../types/enums"
import { SQLI } from "./sqli"
import { XSS } from "./xss"
function getRandomFromArray(size: number = 250, dataArray: string[]) {
  const rnds = []
  if (size >= dataArray.length) {
    return dataArray
  }
  for (let i = 0; i < size; i++) {
    let rnd = Math.floor(Math.random() * dataArray.length)
    if (rnd == dataArray.length) {
      // Fit into array by taking last element
      rnd = dataArray.length - 1
    }
    rnds.push(dataArray[rnd])
  }
  return rnds
}

export function getValues(payloadType: string) {
  if (payloadType == AttackType.Enum.XSS) {
    return getRandomFromArray(250, XSS)
  } else if (
    payloadType == AttackType.Enum.SQLI ||
    payloadType == AttackType.Enum.SQLI_AUTH_BYPASS
  ) {
    return getRandomFromArray(250, SQLI)
  } else if (payloadType == AttackType.Enum.SQLI_TIME) {
    return getRandomFromArray(250, SQLI_TIME)
  } else if (payloadType == AttackType.Enum.TEST) {
    return ["ABCD", "1234", "ˀ.¸ˇ", "œ˙´˳", "þ¥¨ʼ", "ø,“‘"]
  } else {
    return []
  }
}
