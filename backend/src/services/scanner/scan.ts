import { DataClass } from "@common/enums";
import {
  ADDRESS_REGEXP,
  COORDINATE_REGEXP,
  CREDIT_CARD_REGEXP,
  DOB_REGEXP,
  DRIVER_LICENSE_REGEXP,
  EMAIL_REGEXP,
  IP_ADDRESS_REGEXP,
  PHONE_NUMBER_REGEXP,
  SSN_REGEXP,
  VIN_REGEXP,
} from "./regexp";

const DATA_CLASS_REGEX_MAP = new Map<DataClass, RegExp>([
  [DataClass.ADDRESS, ADDRESS_REGEXP],
  [DataClass.DL_NUMBER, DRIVER_LICENSE_REGEXP],
  [DataClass.COORDINATE, COORDINATE_REGEXP],
  [DataClass.CREDIT_CARD, CREDIT_CARD_REGEXP],
  [DataClass.DOB, DOB_REGEXP],
  [DataClass.EMAIL, EMAIL_REGEXP],
  [DataClass.IP_ADDRESS, IP_ADDRESS_REGEXP],
  [DataClass.PHONE_NUMBER, PHONE_NUMBER_REGEXP],
  [DataClass.SSN, SSN_REGEXP],
  [DataClass.VIN, VIN_REGEXP],
]);

export class ScannerService {
  static scan = (text: string) => {
    const res: Record<DataClass, string[]> = {} as Record<DataClass, string[]>;
    DATA_CLASS_REGEX_MAP.forEach((exp, dataClass) => {
      const matches = text.match(exp);
      if (matches?.length > 0) {
        res[dataClass] = matches;
      }
    });
    return res;
  };
}
