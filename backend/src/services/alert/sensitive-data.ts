import { QueryRunner } from "typeorm"
import { QueuedApiTrace } from "@common/types"
import { Alert, DataField } from "models"
import { MetloContext } from "types"
import { AlertType, DataSection, RestMethod } from "@common/enums"
import { existingUnresolvedAlert } from "./utils"
import {
  ALERT_TYPE_TO_RISK_SCORE,
  DATA_SECTION_TO_LABEL_MAP,
} from "@common/maps"
import mlog from "logger"
import { getPathTokens } from "@common/utils"

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

export const createSensitiveDataAlerts = async (
  ctx: MetloContext,
  dataField: DataField,
  apiEndpointUuid: string,
  apiEndpointPath: string,
  apiTrace: QueuedApiTrace,
  queryRunner: QueryRunner,
): Promise<Alert[]> => {
  try {
    let alerts: Alert[] = []
    for (const dataClass of dataField.dataClasses) {
      let alertsToAdd: {
        description: string
        type: AlertType
        context: object
      }[] = []
      const description = `Sensitive data of type ${dataClass} has been detected in field '${
        dataField.dataPath
      }' of ${DATA_SECTION_TO_LABEL_MAP[dataField.dataSection]}.`
      alertsToAdd.push({
        description,
        type: AlertType.PII_DATA_DETECTED,
        context: { trace: apiTrace },
      })
      if (dataField.dataSection === DataSection.REQUEST_QUERY) {
        const sensitiveQueryDescription = `Query Parameter '${dataField.dataPath}' contains sensitive data of type ${dataClass}.`
        alertsToAdd.push({
          description: sensitiveQueryDescription,
          type: AlertType.QUERY_SENSITIVE_DATA,
          context: { trace: apiTrace },
        })
      }
      if (dataField.dataSection === DataSection.REQUEST_PATH) {
        let pathTokenIdx = null
        let sensitivePathDescription = `Path Parameters contain sensitive data of type ${dataClass}.`
        const endpointPathTokens = getPathTokens(apiEndpointPath)
        for (let i = 0; i < endpointPathTokens.length; i++) {
          if (endpointPathTokens[i] === `{${dataField.dataPath}}`) {
            pathTokenIdx = i
            sensitivePathDescription = `Path Parameter at position ${
              i + 1
            } contains sensitive data of type ${dataClass}.`
          }
        }
        alertsToAdd.push({
          description: sensitivePathDescription,
          type: AlertType.PATH_SENSITIVE_DATA,
          context: { trace: apiTrace, pathTokenIdx },
        })
      }
      for (const alert of alertsToAdd) {
        const existing =
          existingDataFieldAlert(alerts, apiEndpointUuid, alert.description) ||
          (await existingUnresolvedAlert(
            ctx,
            apiEndpointUuid,
            alert.type,
            alert.description,
            queryRunner,
          ))
        if (!existing) {
          const newAlert = new Alert()
          newAlert.type = alert.type
          newAlert.riskScore = ALERT_TYPE_TO_RISK_SCORE[alert.type]
          newAlert.apiEndpointUuid = apiEndpointUuid
          newAlert.context = alert.context
          newAlert.description = alert.description
          newAlert.createdAt = apiTrace.createdAt
          newAlert.updatedAt = apiTrace.createdAt
          alerts.push(newAlert)
        }
      }
    }
    return alerts
  } catch (err) {
    mlog.withErr(err).error("Error creating sensitive data alerts")
    return []
  }
}
