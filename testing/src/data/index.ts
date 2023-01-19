import { PredefinedPayloadType } from "../types/enums"
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
  if (payloadType == PredefinedPayloadType.Enum.XSS) {
    return getRandomFromArray(250, XSS)
  } else if (
    payloadType == PredefinedPayloadType.Enum.SQLI ||
    payloadType == PredefinedPayloadType.Enum.SQLI_AUTH_BYPASS
  ) {
    return getRandomFromArray(250, SQLI)
  } else if (payloadType == PredefinedPayloadType.Enum.SQLI_TIME) {
    return getRandomFromArray(250, SQLI_TIME)
  } else {
    return []
  }
}
