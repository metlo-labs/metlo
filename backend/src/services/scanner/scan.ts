import { DataClass } from "@common/enums"
import {
  ADDRESS_REGEXP,
  COORDINATE_REGEXP,
  CREDIT_CARD_REGEXP,
  DOB_REGEXP,
  EMAIL_REGEXP,
  IP_ADDRESS_REGEXP,
  PHONE_NUMBER_REGEXP,
  SSN_REGEXP,
  VIN_REGEXP,
} from "services/scanner/regexp"

const DATA_CLASS_REGEX_MAP = new Map<DataClass, RegExp>([
  [DataClass.ADDRESS, ADDRESS_REGEXP],
  [DataClass.COORDINATE, COORDINATE_REGEXP],
  [DataClass.CREDIT_CARD, CREDIT_CARD_REGEXP],
  [DataClass.DOB, DOB_REGEXP],
  [DataClass.EMAIL, EMAIL_REGEXP],
  [DataClass.IP_ADDRESS, IP_ADDRESS_REGEXP],
  [DataClass.PHONE_NUMBER, PHONE_NUMBER_REGEXP],
  [DataClass.SSN, SSN_REGEXP],
  [DataClass.VIN, VIN_REGEXP],
])

export class ScannerService {
  static scan(text: any): Record<DataClass, string> {
    const res: Record<DataClass, string> = {} as Record<DataClass, string>
    let convertedText: string
    try {
      convertedText = text.toString()
    } catch (err) {
      return res
    }
    DATA_CLASS_REGEX_MAP.forEach((exp, dataClass) => {
      const match = exp.exec(convertedText)
      if (match?.length > 0) {
        res[dataClass] = match[0]
      }
    })
    return res
  }
}
