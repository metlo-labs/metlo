import { PredefinedPayloadType } from "../types/enums"
import { SQLI } from "./sqli"
import { SQLI_TIME } from "./sqli_time"
import { XSS } from "./xss"

const MAX_PAYLOAD_VALUES = 300

export const getValues = (payloadType: string) => {
  if (payloadType == PredefinedPayloadType.Enum.XSS) {
    return XSS.slice(0, MAX_PAYLOAD_VALUES)
  } else if (
    payloadType == PredefinedPayloadType.Enum.SQLI ||
    payloadType == PredefinedPayloadType.Enum.SQLI_AUTH_BYPASS
  ) {
    return SQLI.slice(0, MAX_PAYLOAD_VALUES)
  } else if (payloadType == PredefinedPayloadType.Enum.SQLI_TIME) {
    return SQLI_TIME.slice(0, MAX_PAYLOAD_VALUES)
  } else {
    return []
  }
}
