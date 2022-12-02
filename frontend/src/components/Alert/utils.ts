import { FaBell } from "icons/fa/FaBell"
import { TiFlowSwitch } from "icons/ti/TiFlowSwitch"
import { AiFillApi } from "icons/ai/AiFillApi"
import { AiFillLock } from "icons/ai/AiFillLock"
import { BsShieldLockFill } from "icons/bs/BsShieldLockFill"
import { AlertType } from "@common/enums"
import { IconType } from "icons/lib"

export const alertTypeToIcon: (
  alertType: AlertType,
) => IconType = alertType => {
  switch (alertType) {
    case AlertType.OPEN_API_SPEC_DIFF:
      return AiFillApi
    case AlertType.NEW_ENDPOINT:
      return TiFlowSwitch
    case AlertType.PII_DATA_DETECTED:
      return AiFillLock
    case AlertType.UNSECURED_ENDPOINT_DETECTED:
      return BsShieldLockFill
    default:
      return FaBell
  }
}
