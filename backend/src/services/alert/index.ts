import {
  FindOptionsWhere,
  FindManyOptions,
  In,
  FindOptionsOrder,
  Not,
} from "typeorm"
import { AppDataSource } from "data-source"
import { Alert, ApiEndpoint, ApiTrace, DataField } from "models"
import {
  AlertType,
  SpecExtension,
  Status,
  UpdateAlertType,
} from "@common/enums"
import { DATA_SECTION_TO_LABEL_MAP } from "@common/maps"
import { ALERT_TYPE_TO_RISK_SCORE } from "~/constants"
import {
  GetAlertParams,
  Alert as AlertResponse,
  UpdateAlertParams,
} from "@common/types"
import Error409Conflict from "errors/error-409-conflict"
import Error500InternalServer from "errors/error-500-internal-server"

export class AlertService {
  static async updateAlert(
    alertId: string,
    updateAlertParams: UpdateAlertParams,
  ): Promise<Alert> {
    const alertRepository = AppDataSource.getRepository(Alert)
    const alert = await alertRepository.findOne({
      where: {
        uuid: alertId,
      },
      relations: {
        apiEndpoint: true,
      },
    })
    switch (updateAlertParams.updateType) {
      case UpdateAlertType.IGNORE:
        if (alert.status === Status.IGNORED) {
          throw new Error409Conflict("Alert is already being ignored.")
        } else if (alert.status === Status.RESOLVED) {
          throw new Error409Conflict("Alert is resolved and cannot be ignored.")
        }
        alert.status = Status.IGNORED
        break
      case UpdateAlertType.UNIGNORE:
        if (alert.status !== Status.IGNORED) {
          throw new Error409Conflict("Alert is currently not ignored.")
        }
        alert.status = Status.OPEN
        break
      case UpdateAlertType.RESOLVE:
        if (alert.status === Status.RESOLVED) {
          throw new Error409Conflict("Alert is already resolved.")
        } else if (alert.status === Status.IGNORED) {
          throw new Error409Conflict("Alert is ignored and cannot be resolved.")
        }
        alert.status = Status.RESOLVED
        alert.resolutionMessage =
          updateAlertParams.resolutionMessage?.trim() || null
        break
      case UpdateAlertType.UNRESOLVE:
        if (alert.status !== Status.RESOLVED) {
          throw new Error409Conflict("Alert is currently not resolved.")
        }
        alert.status = Status.OPEN
        break
      default:
        throw new Error500InternalServer("Unknown update type.")
    }
    return await alertRepository.save(alert)
  }

  static async getAlerts(
    alertParams: GetAlertParams,
  ): Promise<[AlertResponse[], number]> {
    const alertRepository = AppDataSource.getRepository(Alert)
    let whereConditions: FindOptionsWhere<Alert>[] | FindOptionsWhere<Alert> =
      {}
    let paginationParams: FindManyOptions<Alert> = {}
    let orderParams: FindOptionsOrder<Alert> = {}

    if (alertParams?.apiEndpointUuid) {
      whereConditions = {
        ...whereConditions,
        apiEndpointUuid: alertParams.apiEndpointUuid,
      }
    }
    if (alertParams?.alertTypes) {
      whereConditions = {
        ...whereConditions,
        type: In(alertParams.alertTypes),
      }
    }
    if (alertParams?.riskScores) {
      whereConditions = {
        ...whereConditions,
        riskScore: In(alertParams.riskScores),
      }
    }
    if (alertParams?.status) {
      whereConditions = {
        ...whereConditions,
        status: In(alertParams.status),
      }
    }
    if (alertParams?.offset) {
      paginationParams = {
        ...paginationParams,
        skip: alertParams.offset,
      }
    }
    if (alertParams?.limit) {
      paginationParams = {
        ...paginationParams,
        take: alertParams.limit,
      }
    }
    if (alertParams?.order) {
      orderParams = {
        riskScore: alertParams.order,
      }
    } else {
      orderParams = {
        riskScore: "DESC",
      }
    }

    const alerts = await alertRepository.findAndCount({
      where: whereConditions,
      ...paginationParams,
      relations: {
        apiEndpoint: true,
      },
      order: {
        status: "ASC",
        ...orderParams,
        createdAt: "DESC",
      },
    })

    return alerts
  }

  static async getTopAlerts(): Promise<AlertResponse[]> {
    const alertRepository = AppDataSource.getRepository(Alert)
    return await alertRepository.find({
      where: {
        status: Status.OPEN,
      },
      relations: {
        apiEndpoint: true,
      },
      order: {
        riskScore: "DESC",
        createdAt: "DESC",
      },
      take: 20,
    })
  }

  static async getAlert(alertId: string): Promise<AlertResponse> {
    const alertRepository = AppDataSource.getRepository(Alert)
    return await alertRepository.findOneBy({ uuid: alertId })
  }

  static async getAlertWithConditions(
    conditions: FindOptionsWhere<Alert>,
  ): Promise<Alert> {
    const alertRepository = AppDataSource.getRepository(Alert)
    return await alertRepository.findOneBy(conditions)
  }

  static async existingUnresolvedAlert(
    apiEndpointUuid: string,
    type: AlertType,
    description: string,
  ) {
    const alertRepository = AppDataSource.getRepository(Alert)
    return await alertRepository.findOneBy({
      apiEndpointUuid,
      type,
      status: Not(Status.RESOLVED),
      description,
    })
  }

  static async createAlert(
    alertType: AlertType,
    apiEndpoint: ApiEndpoint,
    description?: string,
    context?: object,
    noDuplicate?: boolean,
  ): Promise<Alert> {
    const alertRepository = AppDataSource.getRepository(Alert)
    let alertDescription = description
    if (!alertDescription) {
      switch (alertType) {
        case AlertType.NEW_ENDPOINT:
          alertDescription = `A new endpoint has been detected: ${apiEndpoint.path}.`
          break
        case AlertType.OPEN_API_SPEC_DIFF:
          alertDescription = `A OpenAPI Spec diff has been detected.`
          break
        case AlertType.PII_DATA_DETECTED:
          alertDescription = `PII Data has been detected.`
          break
        default:
          alertDescription = `A new alert.`
      }
    }
    if (noDuplicate) {
      const existing = await this.existingUnresolvedAlert(
        apiEndpoint.uuid,
        alertType,
        alertDescription,
      )
      if (existing) {
        return null
      }
    }
    const newAlert = new Alert()
    newAlert.type = alertType
    newAlert.riskScore = ALERT_TYPE_TO_RISK_SCORE[alertType]
    newAlert.apiEndpointUuid = apiEndpoint.uuid
    newAlert.context = context
    newAlert.description = alertDescription
    return newAlert
  }

  static existingSensitiveDataAlert(
    sensitiveDataAlerts: Alert[],
    apiEndpointUuid: string,
    description: string,
  ): boolean {
    if (!sensitiveDataAlerts) {
      return false
    }
    for (const alert of sensitiveDataAlerts) {
      if (
        alert.apiEndpointUuid === apiEndpointUuid &&
        alert.description === description
      ) {
        return true
      }
    }
    return false
  }

  static async createSensitiveDataAlerts(
    dataFields: DataField[],
    apiEndpointUuid: string,
    apiTrace: ApiTrace,
    sensitiveDataAlerts?: Alert[],
  ): Promise<Alert[]> {
    if (!dataFields) {
      return []
    }
    let alerts: Alert[] = sensitiveDataAlerts ?? []
    for (const dataField of dataFields) {
      if (dataField.dataClasses) {
        for (const dataClass of dataField.dataClasses) {
          const description = `Sensitive data of type ${dataClass} has been detected in field ${
            dataField.dataPath
          } of ${DATA_SECTION_TO_LABEL_MAP[dataField.dataSection]}.`
          const existing =
            this.existingSensitiveDataAlert(
              alerts,
              apiEndpointUuid,
              description,
            ) ||
            (await this.existingUnresolvedAlert(
              apiEndpointUuid,
              AlertType.PII_DATA_DETECTED,
              description,
            ))
          if (!existing) {
            const newAlert = new Alert()
            newAlert.type = AlertType.PII_DATA_DETECTED
            newAlert.riskScore =
              ALERT_TYPE_TO_RISK_SCORE[AlertType.PII_DATA_DETECTED]
            newAlert.apiEndpointUuid = apiEndpointUuid
            newAlert.context = {
              trace: apiTrace,
            }
            newAlert.description = description
            alerts.push(newAlert)
          }
        }
      }
    }
    return alerts
  }

  static async createSpecDiffAlerts(
    alertItems: Record<string, string[]>,
    apiEndpointUuid: string,
    apiTrace: ApiTrace,
    specString: string,
    specExtension: SpecExtension,
  ): Promise<Alert[]> {
    if (!alertItems) {
      return []
    }
    if (Object.keys(alertItems)?.length === 0) {
      return []
    }
    let alerts: Alert[] = []
    for (const key in alertItems) {
      const existing = await this.existingUnresolvedAlert(
        apiEndpointUuid,
        AlertType.OPEN_API_SPEC_DIFF,
        key,
      )
      if (!existing) {
        const newAlert = new Alert()
        newAlert.type = AlertType.OPEN_API_SPEC_DIFF
        newAlert.riskScore =
          ALERT_TYPE_TO_RISK_SCORE[AlertType.OPEN_API_SPEC_DIFF]
        newAlert.apiEndpointUuid = apiEndpointUuid
        newAlert.context = {
          pathPointer: alertItems[key],
          trace: apiTrace,
          spec: specString,
          specExtension,
        }
        newAlert.description = key
        alerts.push(newAlert)
      }
    }
    return alerts
  }
}
