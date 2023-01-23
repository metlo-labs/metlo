import { QueryRunner } from "typeorm"
import { QueuedApiTrace } from "@common/types"
import { Alert, DataField } from "models"
import { MetloContext } from "types"
import { AlertType, DataSection, RestMethod } from "@common/enums"
import { existingUnresolvedAlert } from "./utils"
import { ALERT_TYPE_TO_RISK_SCORE } from "@common/maps"
import mlog from "logger"

const existingDataFieldAlert = (
  dataFieldAlerts: Alert[],
  apiEndpointUuid: string,
  description: string,
): boolean => {
  if (!dataFieldAlerts) {
    return false
  }
  for (const alert of dataFieldAlerts) {
    if (
      alert.apiEndpointUuid === apiEndpointUuid &&
      alert.description === description
    ) {
      return true
    }
  }
  return false
}

export const createDataFieldAlerts = async (
  ctx: MetloContext,
  dataFields: DataField[],
  apiEndpointUuid: string,
  apiTrace: QueuedApiTrace,
  queryRunner: QueryRunner,
): Promise<Alert[]> => {
  try {
    if (!dataFields) {
      return []
    }
    let alerts: Alert[] = []
    for (const dataField of dataFields) {
      if (dataField.dataSection === DataSection.REQUEST_HEADER) {
        const requestHeaders = apiTrace?.requestHeaders
        const basicAuthDescription = `Basic Authentication detected in Authorization header.`
        if (!requestHeaders) {
          continue
        }
        let found = false
        for (let i = 0; i < requestHeaders.length && !found; i++) {
          const header = requestHeaders[i]
          if (
            header.name.toLowerCase() === "authorization" &&
            header.value.toLowerCase().includes("basic ")
          ) {
            found = true
            const existing =
              existingDataFieldAlert(
                alerts,
                apiEndpointUuid,
                basicAuthDescription,
              ) ||
              (await existingUnresolvedAlert(
                ctx,
                apiEndpointUuid,
                AlertType.BASIC_AUTHENTICATION_DETECTED,
                basicAuthDescription,
                queryRunner,
              ))
            if (!existing) {
              const newAlert = new Alert()
              newAlert.type = AlertType.BASIC_AUTHENTICATION_DETECTED
              newAlert.riskScore =
                ALERT_TYPE_TO_RISK_SCORE[
                  AlertType.BASIC_AUTHENTICATION_DETECTED
                ]
              newAlert.apiEndpointUuid = apiEndpointUuid
              newAlert.context = {
                trace: apiTrace,
              }
              newAlert.description = basicAuthDescription
              newAlert.createdAt = apiTrace.createdAt
              newAlert.updatedAt = apiTrace.createdAt
              alerts.push(newAlert)
            }
          }
        }
      }
    }
    return alerts
  } catch (err) {
    mlog.withErr(err).error("Error creating data field alerts")
    return []
  }
}

export const createUnauthEndpointSenDataAlerts = async (
  endpoints: Array<{
    uuid: string
    path: string
    host: string
    method: RestMethod
  }>,
) => {
  try {
    if (!endpoints || endpoints?.length === 0) {
      return []
    }
    let alerts: Alert[] = []
    for (const item of endpoints) {
      const description = `Unauthenticated endpoint ${item.method} ${item.path} in ${item.host} is returning sensitive data.`
      const newAlert = new Alert()
      newAlert.type = AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA
      newAlert.riskScore =
        ALERT_TYPE_TO_RISK_SCORE[
          AlertType.UNAUTHENTICATED_ENDPOINT_SENSITIVE_DATA
        ]
      newAlert.apiEndpointUuid = item.uuid
      newAlert.description = description
      alerts.push(newAlert)
    }
    return alerts
  } catch (err) {
    mlog.error(
      `Error creating alert for unauthenticated endpoints returning sensitive data: ${err}`,
    )
    return []
  }
}
