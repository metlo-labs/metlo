import { FaBell } from "@react-icons/all-files/fa/FaBell"
import { TiFlowSwitch } from "@react-icons/all-files/ti/TiFlowSwitch"
import { AiFillApi } from "@react-icons/all-files/ai/AiFillApi"
import { AiFillLock } from "@react-icons/all-files/ai/AiFillLock"
import { AlertType } from "@common/enums"
import { IconType } from "@react-icons/all-files/lib"

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
    default:
      return FaBell
  }
}
