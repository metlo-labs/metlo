import { AlertType } from "@common/enums"
import { ALERT_TYPE_TO_RISK_SCORE } from "@common/maps"
import { Alert, ApiEndpoint } from "models"

export const createNewEndpointAlert = (
  apiEndpoint: ApiEndpoint,
  createTime: Date,
): Alert => {
  const newAlert = new Alert()
  newAlert.type = AlertType.NEW_ENDPOINT
  newAlert.riskScore = ALERT_TYPE_TO_RISK_SCORE[AlertType.NEW_ENDPOINT]
  newAlert.apiEndpointUuid = apiEndpoint.uuid
  newAlert.context = {}
  newAlert.createdAt = createTime
  newAlert.updatedAt = createTime
  newAlert.description = `A new endpoint has been detected for ${apiEndpoint.host}: ${apiEndpoint.path}.`
  return newAlert
}
