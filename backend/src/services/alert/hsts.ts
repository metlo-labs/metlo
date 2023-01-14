import { AlertType } from "@common/enums"
import { ALERT_TYPE_TO_RISK_SCORE } from "@common/maps"
import mlog from "logger"
import { Alert, ApiEndpoint, ApiTrace } from "models"
import { MetloContext } from "types"
import { existingUnresolvedAlert } from "./utils"

export const createMissingHSTSAlert = async (
  ctx: MetloContext,
  alertProps: Array<[ApiEndpoint, ApiTrace, string]>,
) => {
  try {
    if (!alertProps) {
      return []
    }
    let alerts: Alert[] = []
    for (const alertProp of alertProps) {
      const existing = await existingUnresolvedAlert(
        ctx,
        alertProp[0].uuid,
        AlertType.UNSECURED_ENDPOINT_DETECTED,
        alertProp[2],
      )
      if (!existing) {
        const newAlert = new Alert()
        newAlert.type = AlertType.UNSECURED_ENDPOINT_DETECTED
        newAlert.riskScore =
          ALERT_TYPE_TO_RISK_SCORE[AlertType.UNSECURED_ENDPOINT_DETECTED]
        newAlert.apiEndpointUuid = alertProp[0].uuid
        newAlert.context = {
          tested_against: `${alertProp[1].host}/${alertProp[1].path}`,
          trace: alertProp[1],
        }
        newAlert.description = alertProp[2]
        alerts.push(newAlert)
      }
    }
    return alerts
  } catch (err) {
    mlog.withErr(err).error("Error creating spec diff alerts")
    return []
  }
}
